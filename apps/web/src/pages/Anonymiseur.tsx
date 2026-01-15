import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  Shield,
  Upload,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
  Square,
  Undo2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { anonymiseurApi } from '@/lib/api';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Types for redaction zones
interface RedactionZone {
  id: string;
  pageNumber: number;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage
  height: number; // percentage
}

export function Anonymiseur() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [redactionZones, setRedactionZones] = useState<RedactionZone[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentZone, setCurrentZone] = useState<Partial<RedactionZone> | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Censor mutation
  const censorMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || redactionZones.length === 0) {
        throw new Error('Fichier et zones de redaction requis');
      }
      return anonymiseurApi.censorWithZones(selectedFile, redactionZones);
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anonymise_${selectedFile?.name || 'document.pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setPdfUrl(URL.createObjectURL(file));
        setRedactionZones([]);
        setCurrentPage(1);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setSelectedFile(file);
        setPdfUrl(URL.createObjectURL(file));
        setRedactionZones([]);
        setCurrentPage(1);
      }
    }
  };

  const handleReset = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setSelectedFile(null);
    setPdfUrl(null);
    setRedactionZones([]);
    setNumPages(0);
    setCurrentPage(1);
    setScale(1);
    censorMutation.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Drawing handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectionMode || !pageContainerRef.current) return;

    const rect = pageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentZone({ x, y, width: 0, height: 0, pageNumber: currentPage });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !pageContainerRef.current) return;

    const rect = pageContainerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(currentX - drawStart.x);
    const height = Math.abs(currentY - drawStart.y);

    setCurrentZone({ x, y, width, height, pageNumber: currentPage });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentZone) {
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentZone(null);
      return;
    }

    // Only add zone if it has meaningful size (at least 1% width and height)
    if (currentZone.width && currentZone.height && currentZone.width > 1 && currentZone.height > 1) {
      const newZone: RedactionZone = {
        id: crypto.randomUUID(),
        pageNumber: currentPage,
        x: currentZone.x!,
        y: currentZone.y!,
        width: currentZone.width,
        height: currentZone.height,
      };
      setRedactionZones((prev) => [...prev, newZone]);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentZone(null);
  };

  const removeZone = (id: string) => {
    setRedactionZones((prev) => prev.filter((z) => z.id !== id));
  };

  const undoLastZone = () => {
    setRedactionZones((prev) => prev.slice(0, -1));
  };

  const clearCurrentPageZones = () => {
    setRedactionZones((prev) => prev.filter((z) => z.pageNumber !== currentPage));
  };

  const zonesOnCurrentPage = redactionZones.filter((z) => z.pageNumber === currentPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Anonymiseur de documents
        </h1>
        <p className="text-muted-foreground mt-1">
          Dessinez des rectangles sur les zones du document que vous souhaitez masquer
        </p>
      </div>

      {/* Upload zone */}
      {!selectedFile ? (
        <Card>
          <CardContent className="pt-6">
            <div
              className={cn(
                'relative rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer',
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleFileChange}
                accept=".pdf"
              />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Glissez votre PDF ici</p>
              <p className="mt-1 text-sm text-muted-foreground">ou cliquez pour parcourir</p>
              <p className="mt-3 text-xs text-muted-foreground">Format accepte : PDF uniquement</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* File info bar */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} Ko
                      {numPages > 0 && ` • ${numPages} page${numPages > 1 ? 's' : ''}`}
                      {redactionZones.length > 0 && (
                        <span className="ml-2">
                          • <span className="text-primary font-medium">{redactionZones.length}</span> zone
                          {redactionZones.length > 1 ? 's' : ''} de redaction
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main content */}
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Left - Controls & Zones */}
            <div className="space-y-4">
              {/* Drawing mode */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MousePointer2 className="h-4 w-4" />
                    Mode de selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant={isSelectionMode ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setIsSelectionMode(true)}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Dessiner une zone
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Cliquez et faites glisser sur le document pour creer une zone de redaction
                  </p>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={undoLastZone}
                    disabled={redactionZones.length === 0}
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Annuler derniere zone
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={clearCurrentPageZones}
                    disabled={zonesOnCurrentPage.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Effacer zones page {currentPage}
                  </Button>
                </CardContent>
              </Card>

              {/* Zones list */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Zones de redaction</span>
                    <Badge variant="secondary">{redactionZones.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Page {currentPage}: {zonesOnCurrentPage.length} zone{zonesOnCurrentPage.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {redactionZones.length > 0 ? (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2 pr-3">
                        {redactionZones.map((zone, idx) => (
                          <div
                            key={zone.id}
                            className={cn(
                              'flex items-center gap-2 rounded-lg p-2 group text-sm',
                              zone.pageNumber === currentPage ? 'bg-primary/10' : 'bg-muted/50'
                            )}
                          >
                            <div
                              className="w-4 h-4 rounded bg-black/80 shrink-0"
                              style={{ opacity: zone.pageNumber === currentPage ? 1 : 0.5 }}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">Zone {idx + 1}</span>
                              <span className="text-muted-foreground ml-1">- Page {zone.pageNumber}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeZone(zone.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                      <Square className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune zone definie</p>
                      <p className="text-xs mt-1">Dessinez sur le document</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Download button */}
              {redactionZones.length > 0 && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => censorMutation.mutate()}
                  disabled={censorMutation.isPending}
                >
                  {censorMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Anonymisation...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Telecharger le PDF anonymise
                    </>
                  )}
                </Button>
              )}

              {/* Error */}
              {censorMutation.isError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {(censorMutation.error as Error).message}
                </div>
              )}
            </div>

            {/* Right - PDF Viewer */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document
                  </CardTitle>
                  {/* Zoom controls */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(2, s + 0.1))}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Page navigation */}
                {numPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} sur {numPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                      disabled={currentPage >= numPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* PDF display with selection overlay */}
                <div
                  className="relative rounded-lg border bg-muted/30 overflow-auto flex justify-center"
                  style={{ height: 'calc(100vh - 420px)', minHeight: '500px' }}
                >
                  {pdfUrl && (
                    <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<Loader2 className="h-8 w-8 animate-spin" />}>
                      <div
                        ref={pageContainerRef}
                        className={cn('relative', isSelectionMode && 'cursor-crosshair')}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        <Page
                          pageNumber={currentPage}
                          scale={scale}
                          loading={<Loader2 className="h-8 w-8 animate-spin" />}
                        />

                        {/* Existing zones overlay */}
                        {zonesOnCurrentPage.map((zone) => (
                          <div
                            key={zone.id}
                            className="absolute bg-black/80 pointer-events-none"
                            style={{
                              left: `${zone.x}%`,
                              top: `${zone.y}%`,
                              width: `${zone.width}%`,
                              height: `${zone.height}%`,
                            }}
                          />
                        ))}

                        {/* Current drawing zone */}
                        {currentZone && currentZone.width && currentZone.height && (
                          <div
                            className="absolute bg-black/60 border-2 border-dashed border-black pointer-events-none"
                            style={{
                              left: `${currentZone.x}%`,
                              top: `${currentZone.y}%`,
                              width: `${currentZone.width}%`,
                              height: `${currentZone.height}%`,
                            }}
                          />
                        )}
                      </div>
                    </Document>
                  )}
                </div>

                {/* Instructions */}
                <p className="text-xs text-muted-foreground text-center mt-3">
                  {isSelectionMode
                    ? 'Cliquez et faites glisser pour dessiner une zone noire sur les informations a masquer'
                    : 'Activez le mode selection pour dessiner des zones de redaction'}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
