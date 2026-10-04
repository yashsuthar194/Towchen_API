import { Injectable, Logger } from '@nestjs/common';
import PDFKitDocument from 'pdfkit';

// Safeguard against CommonJS default export discrepancies
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument: typeof PDFKitDocument =
  (PDFKitDocument as any)?.default || PDFKitDocument || require('pdfkit');

export interface PackagePdfData {
  orderNumber: string;
  planName: string;
  carSegment: string;
  amount: number;
  planPeriodMonths: number;
  incidentsAllowed: number;
  distanceKmAllowed: number;
  hotelAccommodationAllowed: number;
  cabServiceAllowed: number;
  startDate: Date;
  expiryDate: Date;
  paymentStatus: string;
  status: string;

  dealer: {
    formatedId: string;
    name: string;
    number: string;
    email: string;
    residentialAddress?: string | null;
  };

  customer: {
    customerName: string;
    customerNumber: string;
    alternativeNumber?: string | null;
    emailAddress: string;
    residentialAddress: string;
    gstNumber?: string | null;
  };

  vehicle: {
    regNumber: string;
    make: string;
    model: string;
    fuelType: string;
    transmissionType: string;
    registrationYear: number;
    chassisNumber: string;
    odometerReading: number;
    carSegment: string;
  };
}

@Injectable()
export class PackagePdfService {
  private readonly logger = new Logger(PackagePdfService.name);

  /**
   * Generates a PDF certificate buffer for a dealer package order
   */
  async generateCertificatePdfAsync(data: PackagePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 36,
          info: {
            Title: `Towchen Package Certificate - ${data.orderNumber}`,
            Author: 'Towchen 24x7 Roadside Assistance',
            Subject: 'Vehicle Assistance Package Certificate',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const pageWidth = 595.28;
        const margin = 36;
        const contentWidth = pageWidth - margin * 2;

        // --- HEADER BAR ---
        doc.rect(margin, margin, contentWidth, 75).fill('#0F172A');

        doc.fillColor('#FFFFFF')
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('TOWCHEN MOBILITY & ASSISTANCE', margin + 18, margin + 14);

        doc.fontSize(9)
          .font('Helvetica')
          .fillColor('#94A3B8')
          .text('24x7 Nationwide Roadside Assistance & Vehicle Protection', margin + 18, margin + 38);

        doc.fillColor('#38BDF8')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`CERTIFICATE NO: ${data.orderNumber}`, margin + 18, margin + 54);

        // Date on right
        doc.fontSize(8)
          .font('Helvetica')
          .fillColor('#CBD5E1')
          .text(
            `Issue Date: ${new Date(data.startDate).toLocaleDateString('en-IN')}`,
            margin,
            margin + 18,
            { align: 'right', width: contentWidth - 18 },
          );

        doc.fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#4ADE80')
          .text(
            `STATUS: ${data.status.toUpperCase()}`,
            margin,
            margin + 52,
            { align: 'right', width: contentWidth - 18 },
          );

        let y = margin + 88;

        // --- SUBTITLE ---
        doc.fillColor('#1E293B')
          .fontSize(13)
          .font('Helvetica-Bold')
          .text('OFFICIAL VEHICLE ASSISTANCE PACKAGE CERTIFICATE', margin, y, {
            align: 'center',
            width: contentWidth,
          });

        y += 24;

        // --- SECTION BUILDER HELPER ---
        const drawSectionHeader = (title: string, currentY: number) => {
          doc.rect(margin, currentY, contentWidth, 18).fill('#F1F5F9');
          doc.rect(margin, currentY, 4, 18).fill('#2563EB');
          doc.fillColor('#0F172A')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(title, margin + 12, currentY + 4);
          return currentY + 24;
        };

        const drawField = (label: string, value: string, x: number, currentY: number, width: number) => {
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748B').text(label.toUpperCase(), x, currentY);
          doc.fontSize(8.5).font('Helvetica').fillColor('#1E293B').text(value || 'N/A', x, currentY + 10, { width, ellipsis: true });
        };

        // 1. DEALER & CUSTOMER INFO (Two column layout)
        y = drawSectionHeader('1. DEALER & CUSTOMER DETAILS', y);

        const colWidth = (contentWidth - 12) / 2;
        const col1X = margin;
        const col2X = margin + colWidth + 12;

        // Left: Dealer Details
        doc.rect(col1X, y, colWidth, 90).strokeColor('#E2E8F0').lineWidth(0.75).stroke();
        doc.fillColor('#334155').fontSize(8.5).font('Helvetica-Bold').text('ISSUING DEALER INFORMATION', col1X + 10, y + 8);
        drawField('Dealer Name', data.dealer.name, col1X + 10, y + 24, colWidth - 20);
        drawField('Dealer ID', data.dealer.formatedId, col1X + 10, y + 44, (colWidth - 20) / 2);
        drawField('Contact No.', data.dealer.number, col1X + 10 + (colWidth - 20) / 2, y + 44, (colWidth - 20) / 2);
        drawField('Email', data.dealer.email, col1X + 10, y + 64, colWidth - 20);

        // Right: Customer Details
        doc.rect(col2X, y, colWidth, 90).strokeColor('#E2E8F0').lineWidth(0.75).stroke();
        doc.fillColor('#334155').fontSize(8.5).font('Helvetica-Bold').text('BENEFICIARY / CUSTOMER DETAILS', col2X + 10, y + 8);
        drawField('Customer Name', data.customer.customerName, col2X + 10, y + 24, (colWidth - 20) * 0.6);
        drawField('Mobile No.', data.customer.customerNumber, col2X + 10 + (colWidth - 20) * 0.6, y + 24, (colWidth - 20) * 0.4);
        drawField('Email', data.customer.emailAddress, col2X + 10, y + 44, (colWidth - 20) * 0.6);
        drawField('GSTIN', data.customer.gstNumber || 'Not Applicable', col2X + 10 + (colWidth - 20) * 0.6, y + 44, (colWidth - 20) * 0.4);
        drawField('Address', data.customer.residentialAddress, col2X + 10, y + 64, colWidth - 20);

        y += 100;

        // 2. VEHICLE INFORMATION
        y = drawSectionHeader('2. COVERED VEHICLE SPECIFICATIONS', y);

        const vColWidth = (contentWidth - 20) / 4;
        doc.rect(margin, y, contentWidth, 75).strokeColor('#E2E8F0').lineWidth(0.75).stroke();

        // Row 1
        drawField('Registration No.', data.vehicle.regNumber, margin + 10, y + 8, vColWidth);
        drawField('Make', data.vehicle.make, margin + 10 + vColWidth, y + 8, vColWidth);
        drawField('Model', data.vehicle.model, margin + 10 + vColWidth * 2, y + 8, vColWidth);
        drawField('Car Segment', data.vehicle.carSegment, margin + 10 + vColWidth * 3, y + 8, vColWidth);

        // Row 2
        drawField('Fuel Type', data.vehicle.fuelType, margin + 10, y + 40, vColWidth);
        drawField('Transmission', data.vehicle.transmissionType, margin + 10 + vColWidth, y + 40, vColWidth);
        drawField('Reg. Year', String(data.vehicle.registrationYear), margin + 10 + vColWidth * 2, y + 40, vColWidth);
        drawField('Odometer (KM)', `${data.vehicle.odometerReading} km`, margin + 10 + vColWidth * 3, y + 40, vColWidth);

        y += 85;

        // 3. PACKAGE & BENEFITS SUMMARY
        y = drawSectionHeader('3. PACKAGE PLAN & COMPREHENSIVE COVERAGE BENEFITS', y);

        doc.rect(margin, y, contentWidth, 110).strokeColor('#E2E8F0').lineWidth(0.75).stroke();

        // Plan banner inside box
        doc.rect(margin + 1, y + 1, contentWidth - 2, 28).fill('#EEF2FF');
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#3730A3').text(`PACKAGE: ${data.planName.toUpperCase()} (${data.carSegment.toUpperCase()} SEGMENT)`, margin + 12, y + 9);
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#059669').text(`INR ${data.amount.toFixed(2)}`, margin, y + 9, { align: 'right', width: contentWidth - 12 });

        const pColWidth = (contentWidth - 24) / 4;
        const bY = y + 36;

        drawField('Coverage Period', `${data.planPeriodMonths} Months`, margin + 10, bY, pColWidth);
        drawField('Start Date', new Date(data.startDate).toLocaleDateString('en-IN'), margin + 10 + pColWidth, bY, pColWidth);
        drawField('Expiry Date', new Date(data.expiryDate).toLocaleDateString('en-IN'), margin + 10 + pColWidth * 2, bY, pColWidth);
        drawField('Breakdown Incidents', `${data.incidentsAllowed} Incidents Included`, margin + 10 + pColWidth * 3, bY, pColWidth);

        const bY2 = bY + 36;
        drawField('Towing / Assist Distance', `${data.distanceKmAllowed} KM per Incident`, margin + 10, bY2, pColWidth);
        drawField('Hotel Accommodation', `${data.hotelAccommodationAllowed} Covered Stays / Claims`, margin + 10 + pColWidth, bY2, pColWidth);
        drawField('Cab Services', `${data.cabServiceAllowed} Covered Rides / Claims`, margin + 10 + pColWidth * 2, bY2, pColWidth);
        drawField('Settlement Status', data.paymentStatus, margin + 10 + pColWidth * 3, bY2, pColWidth);

        y += 122;

        // --- TERMS & HELPLINE NOTICE ---
        doc.rect(margin, y, contentWidth, 54).fill('#FEFCE8');
        doc.rect(margin, y, contentWidth, 54).strokeColor('#FEF08A').lineWidth(0.75).stroke();

        doc.fillColor('#854D0E').fontSize(7.5).font('Helvetica-Bold').text('EMERGENCY ASSISTANCE & CLAIM GUIDELINES:', margin + 10, y + 6);
        doc.fontSize(7).font('Helvetica').fillColor('#713F12').text(
          '1. To report an incident or request hotel accommodation / cab service assistance, contact the 24x7 Towchen Dispatch Helpline.\n' +
          '2. Vehicle must match the verified registration and chassis number recorded in this certificate.\n' +
          '3. This is a computer-generated electronic certificate issued through authorized Towchen Dealer Partner network.',
          margin + 10,
          y + 18,
          { width: contentWidth - 20, lineGap: 1.5 },
        );

        y += 64;

        // Footer
        doc.fontSize(7).font('Helvetica').fillColor('#94A3B8').text(
          `Generated on ${new Date().toLocaleString('en-IN')} | Certificate ID: ${data.orderNumber} | Towchen Mobility Services India Pvt Ltd`,
          margin,
          pageWidth > y ? y : 800,
          { align: 'center', width: contentWidth },
        );

        doc.end();
      } catch (error) {
        this.logger.error('Failed to generate package PDF certificate', error);
        reject(error);
      }
    });
  }
}
