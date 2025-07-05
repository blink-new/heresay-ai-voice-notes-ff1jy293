import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Trash2, Plus, BookOpen } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { DictionaryEntry } from '../App'

interface DictionaryProps {
  entries: DictionaryEntry[]
  onAddEntry: (word: string, correctSpelling: string) => Promise<void>
  onDeleteEntry: (id: string) => Promise<void>
}

export function Dictionary({ entries, onAddEntry, onDeleteEntry }: DictionaryProps) {
  const [newWord, setNewWord] = useState('')
  const [correctSpelling, setCorrectSpelling] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddEntry = async () => {
    if (!newWord.trim() || !correctSpelling.trim()) {
      toast.error('Please enter both word and correct spelling')
      return
    }

    setIsAdding(true)
    try {
      await onAddEntry(newWord.trim(), correctSpelling.trim())
      setNewWord('')
      setCorrectSpelling('')
      toast.success('Dictionary entry added!')
    } catch (error) {
      console.error('Error adding entry:', error)
      toast.error('Failed to add entry')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    try {
      await onDeleteEntry(id)
      toast.success('Entry deleted')
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Failed to delete entry')
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Entry */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg neumorphism-inner">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Dictionary Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-1">
                Word (as spoken)
              </label>
              <Input
                id="word"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="e.g., 'nukular'"
                className="bg-white/50 border-white/30"
              />
            </div>
            <div>
              <label htmlFor="spelling" className="block text-sm font-medium text-gray-700 mb-1">
                Correct Spelling
              </label>
              <Input
                id="spelling"
                value={correctSpelling}
                onChange={(e) => setCorrectSpelling(e.target.value)}
                placeholder="e.g., 'nuclear'"
                className="bg-white/50 border-white/30"
              />
            </div>
          </div>
          <Button
            onClick={handleAddEntry}
            disabled={isAdding}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            {isAdding ? 'Adding...' : 'Add Entry'}
          </Button>
        </CardContent>
      </Card>

      {/* Dictionary Entries */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg neumorphism-inner">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Your Dictionary ({entries.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No dictionary entries yet.</p>
              <p className="text-sm">Add words above to help improve transcription accuracy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/30 hover:bg-white/70 transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-gray-600 text-sm">Spoken:</span>
                        <p className="font-medium text-gray-800">{entry.word}</p>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div>
                        <span className="text-gray-600 text-sm">Correct:</span>
                        <p className="font-medium text-gray-800">{entry.correct_spelling}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}