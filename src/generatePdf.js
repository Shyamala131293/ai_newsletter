import React, { useState } from 'react';
// Create a new file, e.g., generatePdf.js
import staticImage from './AI_image.jpg';

export const generatePdfBlob = async (articles) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();

  const getBase64FromImage = (imgUrl) => {
    return fetch(imgUrl)
      .then(res => res.blob())
      .then(blob => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
  };

  const base64Image = await getBase64FromImage(staticImage);
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Define margins
  const leftMargin = 10; 
  const gapRight = 15;  

  const imageWidth = pageWidth - leftMargin - gapRight;
  const imageHeight = 50;

  // Add image
  pdf.addImage(base64Image, 'PNG', leftMargin, 30, imageWidth, imageHeight);

  // Add main static text below image
  const staticTextY = 30 + imageHeight + 12; // gap below image
  pdf.setFont('Calibri', 'normal'); 
  pdf.setFontSize(20);
  pdf.setTextColor(0, 128, 128);
  const staticText = 'June 2026 AI Newsletter';
  const textWidth = pdf.getTextWidth(staticText);
  const xPosition = (pageWidth - textWidth) / 2;
  pdf.text(staticText, xPosition, staticTextY);

  // colored line below the main text
  const spacingPoints = 3; // space between text and line
  const lineY = staticTextY + spacingPoints;
  pdf.setDrawColor(0, 128, 128);
  pdf.setLineWidth(0.25);
  const marginRight = pageWidth - gapRight;
  pdf.line(leftMargin, lineY, marginRight, lineY);

  // ntro/static text with line wrapping and center alignment
  const introLines = [
    'Stay updated with the latest AI breakthroughs, trends, and enterprise developments.',
    'Your curated source for navigating the evolving landscape of artificial intelligence.'
  ];

  // Starting Y position for the first line
  let introTextY = lineY + 6;
  pdf.setFont('Cambria', 'normal'); // use a common font
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  // Draw each line centered
  introLines.forEach((line) => {
    const lineWidth = pdf.getTextWidth(line);
    const x = (pageWidth - lineWidth) / 2; // center align
    pdf.text(line, x, introTextY);
    introTextY += 5; // line height
  });

  // dd articles inside blue boxes
  const boxPadding = 2;
  const boxMargin = 5;
  const boxWidth = pageWidth - 2 * leftMargin;
  let currentY = introTextY + 5; // start position after intro text

  articles.forEach(article => {
    // Calculate height based on content
    const titleFontSize = 10;
    const descFontSize = 9;
    const linkFontSize = 9;
  
    // Measure title height
    pdf.setFont('Cambria', 'bold');
    pdf.setFontSize(titleFontSize);
    const titleHeight = 6;
  
    // Measure description height
    pdf.setFont('Cambria', 'normal');
    pdf.setFontSize(descFontSize);
    const processedText = article.body.replace(/\n/g, ' ');
    let descLines = pdf.splitTextToSize(processedText, boxWidth - 2 * boxPadding);
    descLines = descLines.slice(0, 2);
    descLines = descLines.map(line => line.trim());
    if (descLines.length > 0) {
      descLines[descLines.length - 1] += '...';
    }
    const descHeight = descLines.length * 5;
  
    // Height for "ReadMore>>" link
    const linkText = "ReadMore>>";
    pdf.setFont('Cambria', 'normal');
    pdf.setFontSize(linkFontSize);
    const linkWidth = pdf.getTextWidth(linkText);
    const linkHeight = 5;
  
    const boxHeight = titleHeight + descHeight + linkHeight + 4 * boxPadding;
  
    // Check for page break
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (currentY + boxHeight > pageHeight - 10) { // 20 margin from bottom
      pdf.addPage();
      currentY = 20; // reset to top margin
    }
  
    // Draw rectangle with blue border
    pdf.setDrawColor(0, 128, 128);
    pdf.setLineWidth(0.5);
    pdf.rect(leftMargin, currentY, boxWidth, boxHeight);
  
    // Add title
    pdf.setFont('Cambria', 'bold');
    pdf.setFontSize(titleFontSize);
    pdf.setTextColor(0, 0, 0);
    pdf.text(article.title, leftMargin + boxPadding, currentY + boxPadding + 6);
  
    // Add description
    pdf.setFont('Cambria', 'normal');
    pdf.setFontSize(descFontSize);
    const descYStart = currentY + boxPadding + 6 +5;
    pdf.text(descLines, leftMargin + boxPadding, descYStart);
  
    // Add "ReadMore>>" hyperlink in blue
    const readMoreX = leftMargin + boxPadding;
    const readMoreY = descYStart + descLines.length * 4;
  
    // Draw "ReadMore" in size 8, blue
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 255);
    pdf.text("ReadMore", readMoreX, readMoreY);
  
    // Measure width of "ReadMore"
    const readMoreTextWidth = pdf.getTextWidth("ReadMore");
  
    // Draw ">>" in smaller size, blue, right after "ReadMore"
    const symbols = ">>";
    const symbolFontSize = 6;
    const symbolX = readMoreX + readMoreTextWidth;
    const symbolY = readMoreY;
  
    pdf.setFontSize(symbolFontSize);
    pdf.text(symbols, symbolX, symbolY);
  
    // Measure width of ">>"
    const symbolsWidth = pdf.getTextWidth(symbols);
  
    // Calculate total width of "ReadMore>>"
    const totalWidth = readMoreTextWidth + symbolsWidth;
  
    // Add hyperlink over the entire "ReadMore>>"
    pdf.link(readMoreX, readMoreY - 8 * 0.2, totalWidth, Math.max(8, symbolFontSize) * 1.2, { url: article.url });
  
    // Draw underline beneath the entire "ReadMore>>"
    const underlineY = readMoreY + 0.75; // slightly below the baseline
    pdf.setLineWidth(0.2);
    pdf.line(readMoreX, underlineY, readMoreX + totalWidth, underlineY);
  
    // Update Y for next article
    currentY += boxHeight + boxMargin;
  });

  // Return the generated PDF blob
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
};