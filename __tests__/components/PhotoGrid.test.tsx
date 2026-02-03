import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    img: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <img {...props}>{children}</img>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onClick, ...props }: { src: string; alt: string; onClick?: () => void }) => (
    <img src={src} alt={alt} onClick={onClick} data-testid="photo-image" {...props} />
  ),
}))

// mock component - replace with actual import when component exists
// import PhotoGrid from '@/src/components/PhotoGrid'

interface Photo {
  id: string
  url: string
  alt?: string
  date?: string
}

interface PhotoGridProps {
  photos: Photo[]
  onPhotoClick?: (photo: Photo) => void
  loading?: boolean
  error?: string | null
  columns?: number
}

// placeholder component for testing - replace with actual component
const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onPhotoClick,
  loading = false,
  error = null,
  columns = 4,
}) => {
  if (loading) {
    return (
      <div data-testid="photo-grid-loading" className="loading">
        Loading photos...
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="photo-grid-error" className="error">
        {error}
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div data-testid="photo-grid-empty" className="empty">
        No photos yet. Start adding some memories!
      </div>
    )
  }

  return (
    <div
      data-testid="photo-grid"
      className="grid"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {photos.map((photo) => (
        <div
          key={photo.id}
          data-testid={`photo-item-${photo.id}`}
          onClick={() => onPhotoClick?.(photo)}
          className="photo-item"
        >
          <img src={photo.url} alt={photo.alt || ''} data-testid="photo-image" />
          {photo.date && <span className="photo-date">{photo.date}</span>}
        </div>
      ))}
    </div>
  )
}

describe('PhotoGrid', () => {
  const mockPhotos: Photo[] = [
    { id: '1', url: '/memories/photo1.jpg', alt: 'Meedo and Beedo at the beach', date: '2025-01-15' },
    { id: '2', url: '/memories/photo2.jpg', alt: 'Birthday celebration', date: '2025-02-01' },
    { id: '3', url: '/memories/photo3.jpg', alt: 'Cooking together' },
  ]

  describe('render states', () => {
    it('renders loading state', () => {
      render(<PhotoGrid photos={[]} loading={true} />)

      expect(screen.getByTestId('photo-grid-loading')).toBeInTheDocument()
      expect(screen.getByText(/loading photos/i)).toBeInTheDocument()
    })

    it('renders error state', () => {
      const errorMessage = 'Failed to load photos'
      render(<PhotoGrid photos={[]} error={errorMessage} />)

      expect(screen.getByTestId('photo-grid-error')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('renders empty state when no photos', () => {
      render(<PhotoGrid photos={[]} />)

      expect(screen.getByTestId('photo-grid-empty')).toBeInTheDocument()
      expect(screen.getByText(/no photos yet/i)).toBeInTheDocument()
    })

    it('renders populated grid with photos', () => {
      render(<PhotoGrid photos={mockPhotos} />)

      expect(screen.getByTestId('photo-grid')).toBeInTheDocument()
      expect(screen.getAllByTestId('photo-image')).toHaveLength(3)
    })

    it('renders photos with correct src and alt', () => {
      render(<PhotoGrid photos={mockPhotos} />)

      const images = screen.getAllByTestId('photo-image')
      expect(images[0]).toHaveAttribute('src', '/memories/photo1.jpg')
      expect(images[0]).toHaveAttribute('alt', 'Meedo and Beedo at the beach')
    })

    it('renders date when provided', () => {
      render(<PhotoGrid photos={mockPhotos} />)

      expect(screen.getByText('2025-01-15')).toBeInTheDocument()
      expect(screen.getByText('2025-02-01')).toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('calls onPhotoClick when a photo is clicked', () => {
      const handleClick = jest.fn()
      render(<PhotoGrid photos={mockPhotos} onPhotoClick={handleClick} />)

      const firstPhoto = screen.getByTestId('photo-item-1')
      fireEvent.click(firstPhoto)

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick).toHaveBeenCalledWith(mockPhotos[0])
    })

    it('handles click on different photos correctly', () => {
      const handleClick = jest.fn()
      render(<PhotoGrid photos={mockPhotos} onPhotoClick={handleClick} />)

      fireEvent.click(screen.getByTestId('photo-item-2'))
      expect(handleClick).toHaveBeenCalledWith(mockPhotos[1])

      fireEvent.click(screen.getByTestId('photo-item-3'))
      expect(handleClick).toHaveBeenCalledWith(mockPhotos[2])
    })

    it('does not crash when onPhotoClick is not provided', () => {
      render(<PhotoGrid photos={mockPhotos} />)

      const firstPhoto = screen.getByTestId('photo-item-1')
      expect(() => fireEvent.click(firstPhoto)).not.toThrow()
    })
  })

  describe('props and configuration', () => {
    it('uses default column count of 4', () => {
      render(<PhotoGrid photos={mockPhotos} />)

      const grid = screen.getByTestId('photo-grid')
      expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(4, 1fr)' })
    })

    it('respects custom column count', () => {
      render(<PhotoGrid photos={mockPhotos} columns={6} />)

      const grid = screen.getByTestId('photo-grid')
      expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(6, 1fr)' })
    })

    it('handles single photo correctly', () => {
      render(<PhotoGrid photos={[mockPhotos[0]]} />)

      expect(screen.getAllByTestId('photo-image')).toHaveLength(1)
    })

    it('handles large number of photos', () => {
      const manyPhotos = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        url: `/memories/photo${i}.jpg`,
        alt: `Photo ${i}`,
      }))

      render(<PhotoGrid photos={manyPhotos} />)

      expect(screen.getAllByTestId('photo-image')).toHaveLength(100)
    })
  })

  describe('accessibility', () => {
    it('has appropriate alt text for images', () => {
      render(<PhotoGrid photos={mockPhotos} />)

      const images = screen.getAllByRole('img')
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt')
      })
    })

    it('uses empty alt for decorative images without alt text', () => {
      const photosWithoutAlt = [{ id: '1', url: '/test.jpg' }]
      render(<PhotoGrid photos={photosWithoutAlt} />)

      const img = screen.getByTestId('photo-image')
      expect(img).toHaveAttribute('alt', '')
    })
  })
})
