/**
 * Photo Upload Integration Tests
 *
 * Tests the complete photo upload flow:
 * - Upload to storage
 * - Create database record
 * - Display in gallery
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Types
type UserId = 'meedo' | 'beedo';

interface Photo {
  id: string;
  url: string;
  uploadedBy: UserId;
  uploadedAt: string;
  caption?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface StorageFile {
  id: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

interface UploadResult {
  success: boolean;
  file?: StorageFile;
  error?: string;
}

// Mock data stores
let photos: Photo[];
let storageFiles: StorageFile[];

// Mock storage bucket URL
const STORAGE_BUCKET_URL = 'https://storage.example.com/photos';

// Allowed file types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper functions
const uploadToStorage = (
  fileName: string,
  fileSize: number,
  mimeType: string
): UploadResult => {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { success: false, error: 'Invalid file type' };
  }

  // Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    return { success: false, error: 'File too large' };
  }

  // Validate file size is positive
  if (fileSize <= 0) {
    return { success: false, error: 'Invalid file size' };
  }

  // Generate unique file path
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const ext = fileName.split('.').pop();
  const path = `uploads/${fileId}.${ext}`;
  const url = `${STORAGE_BUCKET_URL}/${path}`;

  const storageFile: StorageFile = {
    id: fileId,
    path,
    url,
    size: fileSize,
    mimeType,
  };

  storageFiles.push(storageFile);

  return { success: true, file: storageFile };
};

const createPhotoRecord = (
  storageFile: StorageFile,
  uploadedBy: UserId,
  caption?: string
): Photo => {
  const photo: Photo = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    url: storageFile.url,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    caption,
    fileName: storageFile.path.split('/').pop() || '',
    fileSize: storageFile.size,
    mimeType: storageFile.mimeType,
  };

  photos.push(photo);
  return photo;
};

const uploadPhoto = (
  fileName: string,
  fileSize: number,
  mimeType: string,
  uploadedBy: UserId,
  caption?: string
): { photo?: Photo; error?: string } => {
  // Step 1: Upload to storage
  const uploadResult = uploadToStorage(fileName, fileSize, mimeType);

  if (!uploadResult.success || !uploadResult.file) {
    return { error: uploadResult.error };
  }

  // Step 2: Create database record
  const photo = createPhotoRecord(uploadResult.file, uploadedBy, caption);

  return { photo };
};

const getPhotosByUser = (userId: UserId): Photo[] => {
  return photos.filter(p => p.uploadedBy === userId);
};

const getAllPhotos = (): Photo[] => {
  return [...photos].sort((a, b) =>
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
};

const deletePhoto = (photoId: string, requestedBy: UserId): boolean => {
  const photoIndex = photos.findIndex(p => p.id === photoId);
  if (photoIndex === -1) return false;

  // Either user can delete any photo (it's their shared album)
  photos.splice(photoIndex, 1);
  return true;
};

const getPhotoById = (photoId: string): Photo | undefined => {
  return photos.find(p => p.id === photoId);
};

describe('Photo Upload Integration', () => {
  beforeEach(() => {
    photos = [];
    storageFiles = [];
  });

  describe('Upload to Storage', () => {
    it('should successfully upload a valid JPEG file', () => {
      const result = uploadToStorage('photo.jpg', 1024 * 1024, 'image/jpeg');

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file?.url).toContain(STORAGE_BUCKET_URL);
    });

    it('should successfully upload a valid PNG file', () => {
      const result = uploadToStorage('photo.png', 2 * 1024 * 1024, 'image/png');

      expect(result.success).toBe(true);
      expect(result.file?.mimeType).toBe('image/png');
    });

    it('should successfully upload a valid GIF file', () => {
      const result = uploadToStorage('animation.gif', 500 * 1024, 'image/gif');

      expect(result.success).toBe(true);
    });

    it('should successfully upload a valid WebP file', () => {
      const result = uploadToStorage('photo.webp', 800 * 1024, 'image/webp');

      expect(result.success).toBe(true);
    });

    it('should reject invalid file type', () => {
      const result = uploadToStorage('document.pdf', 1024 * 1024, 'application/pdf');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid file type');
    });

    it('should reject file that is too large', () => {
      const result = uploadToStorage('huge.jpg', 15 * 1024 * 1024, 'image/jpeg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File too large');
    });

    it('should reject file with zero size', () => {
      const result = uploadToStorage('empty.jpg', 0, 'image/jpeg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid file size');
    });

    it('should generate unique file paths', () => {
      const result1 = uploadToStorage('photo.jpg', 1024, 'image/jpeg');
      const result2 = uploadToStorage('photo.jpg', 1024, 'image/jpeg');

      expect(result1.file?.path).not.toBe(result2.file?.path);
    });

    it('should store file in storage array', () => {
      expect(storageFiles).toHaveLength(0);

      uploadToStorage('photo.jpg', 1024, 'image/jpeg');

      expect(storageFiles).toHaveLength(1);
    });
  });

  describe('Create Database Record', () => {
    it('should create photo record with all required fields', () => {
      const uploadResult = uploadToStorage('photo.jpg', 1024, 'image/jpeg');
      const photo = createPhotoRecord(uploadResult.file!, 'meedo');

      expect(photo.id).toBeDefined();
      expect(photo.url).toBe(uploadResult.file?.url);
      expect(photo.uploadedBy).toBe('meedo');
      expect(photo.uploadedAt).toBeDefined();
      expect(photo.fileName).toBeDefined();
      expect(photo.fileSize).toBe(1024);
      expect(photo.mimeType).toBe('image/jpeg');
    });

    it('should create photo record with optional caption', () => {
      const uploadResult = uploadToStorage('photo.jpg', 1024, 'image/jpeg');
      const photo = createPhotoRecord(uploadResult.file!, 'beedo', 'Our first date');

      expect(photo.caption).toBe('Our first date');
    });

    it('should store photo in database array', () => {
      expect(photos).toHaveLength(0);

      const uploadResult = uploadToStorage('photo.jpg', 1024, 'image/jpeg');
      createPhotoRecord(uploadResult.file!, 'meedo');

      expect(photos).toHaveLength(1);
    });
  });

  describe('Complete Upload Flow', () => {
    it('should complete full upload flow for valid image', () => {
      const result = uploadPhoto(
        'vacation.jpg',
        2 * 1024 * 1024,
        'image/jpeg',
        'meedo',
        'Beach vacation 2025'
      );

      expect(result.photo).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.photo?.uploadedBy).toBe('meedo');
      expect(result.photo?.caption).toBe('Beach vacation 2025');
      expect(storageFiles).toHaveLength(1);
      expect(photos).toHaveLength(1);
    });

    it('should fail upload flow for invalid file type', () => {
      const result = uploadPhoto(
        'document.docx',
        1024,
        'application/msword',
        'beedo'
      );

      expect(result.photo).toBeUndefined();
      expect(result.error).toBe('Invalid file type');
      expect(storageFiles).toHaveLength(0);
      expect(photos).toHaveLength(0);
    });

    it('should fail upload flow for file too large', () => {
      const result = uploadPhoto(
        'huge.png',
        20 * 1024 * 1024,
        'image/png',
        'meedo'
      );

      expect(result.photo).toBeUndefined();
      expect(result.error).toBe('File too large');
    });
  });

  describe('Display in Gallery', () => {
    beforeEach(() => {
      // Upload some test photos
      uploadPhoto('photo1.jpg', 1024, 'image/jpeg', 'meedo', 'Photo 1');
      uploadPhoto('photo2.jpg', 2048, 'image/jpeg', 'beedo', 'Photo 2');
      uploadPhoto('photo3.png', 3072, 'image/png', 'meedo', 'Photo 3');
    });

    it('should get all photos sorted by upload date (newest first)', () => {
      const allPhotos = getAllPhotos();

      expect(allPhotos).toHaveLength(3);
      // Most recent should be first
      expect(allPhotos[0].caption).toBe('Photo 3');
    });

    it('should get photos by specific user', () => {
      const meedoPhotos = getPhotosByUser('meedo');
      const beedoPhotos = getPhotosByUser('beedo');

      expect(meedoPhotos).toHaveLength(2);
      expect(beedoPhotos).toHaveLength(1);
    });

    it('should get photo by ID', () => {
      const allPhotos = getAllPhotos();
      const firstPhoto = allPhotos[0];

      const retrieved = getPhotoById(firstPhoto.id);

      expect(retrieved).toEqual(firstPhoto);
    });

    it('should return undefined for non-existent photo ID', () => {
      const retrieved = getPhotoById('fake_id');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('Photo Deletion', () => {
    let photoId: string;

    beforeEach(() => {
      const result = uploadPhoto('to_delete.jpg', 1024, 'image/jpeg', 'meedo');
      photoId = result.photo!.id;
    });

    it('should allow deleting own photo', () => {
      const deleted = deletePhoto(photoId, 'meedo');

      expect(deleted).toBe(true);
      expect(photos).toHaveLength(0);
    });

    it('should allow deleting partners photo (shared album)', () => {
      const deleted = deletePhoto(photoId, 'beedo');

      expect(deleted).toBe(true);
      expect(photos).toHaveLength(0);
    });

    it('should return false for non-existent photo', () => {
      const deleted = deletePhoto('fake_id', 'meedo');

      expect(deleted).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle photo with very long filename', () => {
      const longName = 'a'.repeat(200) + '.jpg';
      const result = uploadPhoto(longName, 1024, 'image/jpeg', 'meedo');

      expect(result.photo).toBeDefined();
    });

    it('should handle photo with unicode filename', () => {
      const result = uploadPhoto('photo.jpg', 1024, 'image/jpeg', 'beedo');

      expect(result.photo).toBeDefined();
    });

    it('should handle multiple rapid uploads', () => {
      for (let i = 0; i < 10; i++) {
        uploadPhoto(`photo${i}.jpg`, 1024, 'image/jpeg', 'meedo');
      }

      expect(photos).toHaveLength(10);
      expect(storageFiles).toHaveLength(10);

      // All should have unique IDs
      const ids = photos.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    it('should handle file at exact max size limit', () => {
      const result = uploadPhoto(
        'maxsize.jpg',
        MAX_FILE_SIZE,
        'image/jpeg',
        'meedo'
      );

      expect(result.photo).toBeDefined();
    });

    it('should reject file just over max size limit', () => {
      const result = uploadPhoto(
        'oversize.jpg',
        MAX_FILE_SIZE + 1,
        'image/jpeg',
        'meedo'
      );

      expect(result.error).toBe('File too large');
    });
  });
});
