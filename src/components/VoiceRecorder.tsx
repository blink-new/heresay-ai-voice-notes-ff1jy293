import { useState, useRef } from 'react'
import { blink } from '../blink/client'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Mic, MicOff, Copy, Wand2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { DictionaryEntry } from '../App'

interface VoiceRecorderProps {
  onSaveNote: (originalText: string, correctedText: string) => Promise<void>
  dictionary: DictionaryEntry[]
}

export function VoiceRecorder({ onSaveNote, dictionary }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [originalText, setOriginalText] = useState('')
  const [correctedText, setCorrectedText] = useState('')
  const [, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      toast.success('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      toast.success('Recording stopped')
    }
  }

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true)
    try {
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const base64Data = dataUrl.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      const { text } = await blink.ai.transcribeAudio({
        audio: base64,
        language: 'en'
      })

      setOriginalText(text)
      await correctText(text)
    } catch (error) {
      console.error('Error transcribing audio:', error)
      toast.error('Failed to transcribe audio')
    } finally {
      setIsTranscribing(false)
    }
  }

  const correctText = async (text: string) => {
    setIsProcessing(true)
    try {
      // Create dictionary context for better correction
      const dictionaryContext = dictionary.length > 0 
        ? `\n\nCustom Dictionary (use these correct spellings):\n${dictionary.map(entry => `- "${entry.word}" should be spelled as "${entry.correct_spelling}"`).join('\n')}`
        : ''

      const { text: corrected } = await blink.ai.generateText({
        prompt: `Please correct the grammar, punctuation, and spelling in this transcribed text. Make it well-formatted and professional while preserving the original meaning and tone. Apply proper capitalization and sentence structure.${dictionaryContext}

Original text: "${text}"

Return only the corrected text without any explanations or formatting.`,
        model: 'gpt-4o-mini',
        maxTokens: 500
      })

      setCorrectedText(corrected.trim())
    } catch (error) {
      console.error('Error correcting text:', error)
      toast.error('Failed to correct text')
      setCorrectedText(text) // Fallback to original text
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const saveNote = async () => {
    if (!originalText || !correctedText) {
      toast.error('No text to save')
      return
    }

    try {
      await onSaveNote(originalText, correctedText)
      toast.success('Note saved!')
      setOriginalText('')
      setCorrectedText('')
      setAudioBlob(null)
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save note')
    }
  }

  const reprocessText = async () => {
    if (!originalText) {
      toast.error('No text to reprocess')
      return
    }
    await correctText(originalText)
  }

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg neumorphism-inner">
        <CardHeader>
          <CardTitle className="text-center text-gray-800">Voice Recording</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing || isProcessing}
              size="lg"
              className={`w-24 h-24 rounded-full ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white shadow-lg transition-all duration-200 transform hover:scale-105`}
            >
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </Button>
          </div>
          <p className="text-gray-600">
            {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
          </p>
          {isTranscribing && (
            <p className="text-blue-600 animate-pulse">Transcribing audio...</p>
          )}
          {isProcessing && (
            <p className="text-purple-600 animate-pulse">Correcting text...</p>
          )}
        </CardContent>
      </Card>

      {/* Text Results */}
      {(originalText || correctedText) && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Original Text */}
          {originalText && (
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg neumorphism-inner">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center justify-between">
                  Original Transcription
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(originalText)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  className="min-h-32 bg-white/50 border-white/30 resize-none"
                  placeholder="Original transcription will appear here..."
                />
              </CardContent>
            </Card>
          )}

          {/* Corrected Text */}
          {correctedText && (
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg neumorphism-inner">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center justify-between">
                  AI Corrected Text
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={reprocessText}
                      disabled={isProcessing}
                    >
                      <Wand2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(correctedText)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={correctedText}
                  onChange={(e) => setCorrectedText(e.target.value)}
                  className="min-h-32 bg-white/50 border-white/30 resize-none"
                  placeholder="Corrected text will appear here..."
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Save Button */}
      {originalText && correctedText && (
        <div className="text-center">
          <Button
            onClick={saveNote}
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Save Note
          </Button>
        </div>
      )}
    </div>
  )
}