import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get document record
    const { data: document, error: docError } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update status to processing
    await supabase
      .from('uploaded_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-documents')
      .download(document.storage_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file');
    }

    let extractedText = '';

    // Extract text based on file type
    if (document.file_type === 'application/pdf') {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      // Dynamic import for pdf-parse (CommonJS module)
      // @ts-ignore - pdf-parse has CommonJS export issues
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (document.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      // Dynamic import for mammoth
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (document.file_type === 'text/plain' || document.file_type === 'text/csv') {
      extractedText = await fileData.text();
    } else {
      throw new Error('Unsupported file type');
    }

    // Truncate if too long (max 50,000 characters for context)
    if (extractedText.length > 50000) {
      extractedText = extractedText.substring(0, 50000) + '\n\n[Document truncated due to length]';
    }

    // Update document with extracted text
    const { error: updateError } = await supabase
      .from('uploaded_documents')
      .update({
        extracted_text: extractedText,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      extractedText: extractedText.substring(0, 500) + '...' // Return preview
    });

  } catch (error: any) {
    console.error('Document processing error:', error);

    // Update status to failed
    if (req.body) {
      const { documentId } = await req.json();
      const supabase = await createClient();
      await supabase
        .from('uploaded_documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}
