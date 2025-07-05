import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Copy, Trash2, Clock, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { VoiceNote } from '../App'

interface HistoryProps {
  notes: VoiceNote[]
  onDeleteNote: (id: string) => Promise<void>
}

export function History({ notes, onDeleteNote }: HistoryProps) {
  const [selectedNote, setSelectedNote] = useState<VoiceNote | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await onDeleteNote(id)
      toast.success('Note deleted')
      if (selectedNote?.id === id) {
        setSelectedNote(null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg neumorphism-inner">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Voice Notes History ({notes.length} notes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No voice notes yet.</p>
              <p className="text-sm">Your recorded notes will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Notes List */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800 mb-3">Recent Notes</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedNote?.id === note.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white/50 border-white/30 hover:bg-white/70'
                      }`}
                      onClick={() => setSelectedNote(note)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 line-clamp-2">
                            {truncateText(note.correctedText || note.originalText)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(note.createdAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNote(note.id)
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Note Detail */}
              <div className="lg:sticky lg:top-0">
                {selectedNote ? (
                  <Card className="bg-white/60 backdrop-blur-sm border-white/40">
                    <CardHeader>
                      <CardTitle className="text-gray-800 text-lg">
                        Note Details
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedNote.createdAt)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="corrected" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="corrected">Corrected</TabsTrigger>
                          <TabsTrigger value="original">Original</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="corrected" className="space-y-4">
                          <div className="p-4 bg-white/40 rounded-lg border border-white/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                AI Corrected Text
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(selectedNote.correctedText)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap">
                              {selectedNote.correctedText}
                            </p>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="original" className="space-y-4">
                          <div className="p-4 bg-white/40 rounded-lg border border-white/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Original Transcription
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(selectedNote.originalText)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap">
                              {selectedNote.originalText}
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/60 backdrop-blur-sm border-white/40">
                    <CardContent className="flex items-center justify-center py-16">
                      <div className="text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Select a note to view details</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}