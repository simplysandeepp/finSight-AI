import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ExecutiveReport = ({ disabled }) => {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    const target = document.getElementById('dashboard-export-area');
    if (!target) return;

    setGenerating(true);
    try {
      const canvas = await html2canvas(target, {
        backgroundColor: '#0b0e16',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // A4 page dimensions in mm
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Calculate scaled dimensions preserving aspect ratio
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      const pdf = new jsPDF({
        orientation: scaledHeight > scaledWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const xOffset = (pdf.internal.pageSize.getWidth() - scaledWidth) / 2;
      const yOffset = 10;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);
      pdf.save(`FinSight_Executive_Report_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || generating}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
    >
      {generating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      {generating ? 'Generating...' : 'Download Executive Report'}
    </button>
  );
};

export default ExecutiveReport;
