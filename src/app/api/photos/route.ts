import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { Photo, PhotoInsert, ApiResponse } from '@/types/database';

// GET /api/photos - fetch all photos
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: error.message,
        success: false,
      });
    }

    return NextResponse.json<ApiResponse<Photo[]>>({
      data: data || [],
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'internal server error',
      success: false,
    });
  }
}

// POST /api/photos - upload new photos
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const formData = await request.formData();

    const files = formData.getAll('files') as File[];
    const caption = formData.get('caption') as string | null;
    const uploadedBy = formData.get('uploaded_by') as 'meedo' | 'beedo';

    if (!files || files.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'no files provided',
        success: false,
      });
    }

    if (!uploadedBy || !['meedo', 'beedo'].includes(uploadedBy)) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'invalid uploaded_by value',
        success: false,
      });
    }

    const uploadedPhotos: Photo[] = [];

    for (const file of files) {
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${uploadedBy}/${timestamp}-${randomId}.${extension}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filename, file, {
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filename);

      // Insert into database
      const photoData: PhotoInsert = {
        url: urlData.publicUrl,
        storage_path: filename,
        uploaded_by: uploadedBy,
        caption: caption || null,
      };

      const { data: insertedPhoto, error: insertError } = await supabase
        .from('photos')
        .insert(photoData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        // Try to clean up the uploaded file
        await supabase.storage.from('photos').remove([filename]);
        continue;
      }

      uploadedPhotos.push(insertedPhoto);
    }

    if (uploadedPhotos.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'failed to upload any photos',
        success: false,
      });
    }

    return NextResponse.json<ApiResponse<Photo[]>>({
      data: uploadedPhotos,
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'internal server error',
      success: false,
    });
  }
}

// DELETE /api/photos?id=xxx - delete a photo
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'photo id required',
        success: false,
      });
    }

    // Get the photo first to get storage path
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'photo not found',
        success: false,
      });
    }

    // Delete from storage if path exists
    if (photo.storage_path) {
      await supabase.storage.from('photos').remove([photo.storage_path]);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: deleteError.message,
        success: false,
      });
    }

    return NextResponse.json<ApiResponse<{ deleted: string }>>({
      data: { deleted: id },
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'internal server error',
      success: false,
    });
  }
}

// PATCH /api/photos - update a photo (caption, etc)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { id, caption } = body;

    if (!id) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: 'photo id required',
        success: false,
      });
    }

    const { data, error } = await supabase
      .from('photos')
      .update({ caption })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: error.message,
        success: false,
      });
    }

    return NextResponse.json<ApiResponse<Photo>>({
      data,
      error: null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: err instanceof Error ? err.message : 'internal server error',
      success: false,
    });
  }
}
