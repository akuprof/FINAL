
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Image, Download, Eye, Calendar } from "lucide-react";

interface DocumentViewerProps {
  entityId: string;
  entityType: 'trip' | 'fuel-record' | 'checklist' | 'maintenance';
  title?: string;
}

interface Document {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  documentType: string;
  uploadedAt: string;
}

export function DocumentViewer({ entityId, entityType, title = "Attached Documents" }: DocumentViewerProps) {
  const { data: documents, isLoading } = useQuery({
    queryKey: [`/api/documents/${entityType}/${entityId}`],
    retry: false,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const getFileTypeColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (extension === 'pdf') {
      return 'bg-red-100 text-red-800';
    }
    if (['doc', 'docx'].includes(extension || '')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Loading documents...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            No documents attached
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center">
          <FileText className="w-4 h-4 mr-2" />
          {title} ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((document: Document) => (
          <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon(document.fileName)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {document.fileName}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>•</span>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(document.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="secondary" className={`text-xs mt-1 ${getFileTypeColor(document.fileName)}`}>
                  {document.documentType}
                </Badge>
              </div>
            </div>
            <div className="flex space-x-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/api/documents/${document.id}/view`, '_blank')}
                title="View"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/api/documents/${document.id}/download`, '_blank')}
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
