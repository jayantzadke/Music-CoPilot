import { SearchInput } from '@/components/search/SearchInput'

export default function SearchPage() {
  return (
    <div className="py-6 px-6">
      <div className="md:hidden mb-6">
        <SearchInput />
      </div>
      <h1 className="text-2xl font-bold mb-6">Search</h1>
      <p className="text-muted">find songs, albums, artists and playlists</p>
    </div>
  )
}
