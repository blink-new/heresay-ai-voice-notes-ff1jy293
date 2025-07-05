import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { VoiceRecorder } from './components/VoiceRecorder'
import { Dictionary } from './components/Dictionary'
import { History } from './components/History'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Mic, Book, History as HistoryIcon } from 'lucide-react'

export interface VoiceNote {
  id: string
  originalText: string
  correctedText: string
  createdAt: string
  userId: string
}

export interface DictionaryEntry {
  id: string
  word: string
  correctSpelling: string
  userId: string
  createdAt: string
}

function App() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const currentUser = await blink.auth.me()
        setUser(currentUser)
        
        // Load existing notes and dictionary
        await loadNotes(currentUser.id)
        await loadDictionary(currentUser.id)
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  const loadNotes = async (userId: string) => {
    try {
      const userNotes = await blink.db.voice_notes.list({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        limit: 50
      })
      setNotes(userNotes)
    } catch (error) {
      console.error('Error loading notes:', error)
    }
  }

  const loadDictionary = async (userId: string) => {
    try {
      const userDictionary = await blink.db.dictionary_entries.list({
        where: { user_id: userId },
        orderBy: { word: 'asc' }
      })
      setDictionary(userDictionary)
    } catch (error) {
      console.error('Error loading dictionary:', error)
    }
  }

  const addNote = async (originalText: string, correctedText: string) => {
    try {
      const newNote = await blink.db.voice_notes.create({
        original_text: originalText,
        corrected_text: correctedText,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      setNotes(prev => [newNote, ...prev])
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const addDictionaryEntry = async (word: string, correctSpelling: string) => {
    try {
      const newEntry = await blink.db.dictionary_entries.create({
        word: word.toLowerCase(),
        correct_spelling: correctSpelling,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      setDictionary(prev => [...prev, newEntry].sort((a, b) => a.word.localeCompare(b.word)))
    } catch (error) {
      console.error('Error adding dictionary entry:', error)
    }
  }

  const deleteDictionaryEntry = async (id: string) => {
    try {
      await blink.db.dictionary_entries.delete(id)
      setDictionary(prev => prev.filter(entry => entry.id !== id))
    } catch (error) {
      console.error('Error deleting dictionary entry:', error)
    }
  }

  const deleteNote = async (id: string) => {
    try {
      await blink.db.voice_notes.delete(id)
      setNotes(prev => prev.filter(note => note.id !== id))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Heresay...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Heresay</h1>
          <p className="text-gray-600">AI-powered voice notes with smart correction</p>
        </div>

        {/* Main Content */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 neumorphism">
          <Tabs defaultValue="record" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-1">
              <TabsTrigger value="record" className="flex items-center gap-2 rounded-xl">
                <Mic className="w-4 h-4" />
                Record
              </TabsTrigger>
              <TabsTrigger value="dictionary" className="flex items-center gap-2 rounded-xl">
                <Book className="w-4 h-4" />
                Dictionary
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 rounded-xl">
                <HistoryIcon className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="space-y-6">
              <VoiceRecorder 
                onSaveNote={addNote} 
                dictionary={dictionary}
              />
            </TabsContent>

            <TabsContent value="dictionary" className="space-y-6">
              <Dictionary 
                entries={dictionary}
                onAddEntry={addDictionaryEntry}
                onDeleteEntry={deleteDictionaryEntry}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <History 
                notes={notes}
                onDeleteNote={deleteNote}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default App