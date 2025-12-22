/**
 * Export Utilities for Dashboard
 * Supports CSV, Excel, PNG, and PDF exports
 */

import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

// Types
interface MetricCard {
  label: string
  value: string | number
  change?: string
}

interface ProductData {
  name: string
  asin: string
  sales: number
  units: number
  profit: number
  margin: number
  [key: string]: any
}

interface ExportOptions {
  filename?: string
  period?: string
  dateRange?: string
}

/**
 * Export products data to CSV
 */
export function exportToCSV(products: ProductData[], options: ExportOptions = {}) {
  const { filename = 'products-export', dateRange = '' } = options

  // CSV headers
  const headers = ['Product Name', 'ASIN', 'Sales', 'Units', 'Profit', 'Margin %']

  // CSV rows
  const rows = products.map(p => [
    p.name || 'N/A',
    p.asin || 'N/A',
    `$${(p.sales || 0).toLocaleString()}`,
    (p.units || p.unitsSold || 0).toLocaleString(),
    `$${(p.profit || p.netProfit || 0).toLocaleString()}`,
    `${p.margin || 0}%`
  ])

  // Combine headers and rows
  const csvContent = [
    [`SellerGenix Dashboard Export - ${dateRange}`],
    [],
    headers,
    ...rows
  ].map(row => row.join(',')).join('\n')

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}-${Date.now()}.csv`
  link.click()
}

/**
 * Export comprehensive data to Excel (.xlsx)
 * Includes: Metrics, Products, Chart Data
 */
export async function exportToExcel(
  metrics: MetricCard[],
  products: ProductData[],
  chartData: any[],
  options: ExportOptions = {}
) {
  const { filename = 'dashboard-export', dateRange = '', period = '30D' } = options

  // Create new workbook
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SellerGenix'
  wb.created = new Date()

  // Sheet 1: Summary Metrics
  const ws1 = wb.addWorksheet('Summary')
  ws1.addRow(['SellerGenix Dashboard Export'])
  ws1.addRow([`Period: ${period}`, `Date Range: ${dateRange}`])
  ws1.addRow([])
  ws1.addRow(['Metric', 'Value', 'Change'])
  metrics.forEach(m => ws1.addRow([m.label, m.value, m.change || '-']))
  ws1.columns = [{ width: 25 }, { width: 20 }, { width: 15 }]

  // Sheet 2: Products
  const ws2 = wb.addWorksheet('Products')
  ws2.addRow(['Product Performance Report'])
  ws2.addRow([`Generated: ${new Date().toLocaleString()}`])
  ws2.addRow([])
  ws2.addRow(['Product Name', 'ASIN', 'Sales', 'Units Sold', 'Gross Profit', 'Net Profit', 'Margin %', 'ROI %'])
  products.forEach(p => {
    ws2.addRow([
      p.name || 'N/A',
      p.asin || 'N/A',
      p.sales || 0,
      p.units || p.unitsSold || 0,
      p.grossProfit || 0,
      p.profit || p.netProfit || 0,
      p.margin || 0,
      p.roi || 0
    ])
  })
  ws2.columns = [
    { width: 35 }, { width: 15 }, { width: 12 }, { width: 12 },
    { width: 15 }, { width: 15 }, { width: 10 }, { width: 10 }
  ]

  // Sheet 3: Chart Data (Daily/Weekly/Monthly breakdown)
  if (chartData && chartData.length > 0) {
    const ws3 = wb.addWorksheet('Chart Data')
    const chartHeaders = ['Date', ...Object.keys(chartData[0]).filter(k => k !== 'date' && k !== 'dateString')]
    ws3.addRow(['Chart Data'])
    ws3.addRow([])
    ws3.addRow(chartHeaders)
    chartData.forEach(row => {
      const date = row.date || row.dateString
      ws3.addRow([date, ...chartHeaders.slice(1).map(h => row[h] || 0)])
    })
    ws3.columns = Array(chartHeaders.length).fill({ width: 12 })
  }

  // Download
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}-${Date.now()}.xlsx`
  link.click()
}

/**
 * Export chart to PNG image
 */
export async function exportChartToPNG(chartElementId: string, options: ExportOptions = {}) {
  const { filename = 'chart-export' } = options

  const chartElement = document.getElementById(chartElementId)
  if (!chartElement) {
    console.error('Chart element not found')
    return
  }

  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false
    })

    canvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${filename}-${Date.now()}.png`
        link.click()
      }
    })
  } catch (error) {
    console.error('PNG export failed:', error)
  }
}

/**
 * Export comprehensive dashboard to PDF
 * Includes: Header, Metrics, Chart, Products Table
 */
export async function exportToPDF(
  metrics: MetricCard[],
  products: ProductData[],
  chartElementId: string,
  options: ExportOptions = {}
) {
  const { filename = 'dashboard-export', dateRange = '', period = '30D' } = options

  try {
    // Create PDF (A4 size)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 20

    // Header
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('SellerGenix Dashboard Report', 15, yPosition)

    yPosition += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Period: ${period} | ${dateRange}`, 15, yPosition)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 15, yPosition, { align: 'right' })

    yPosition += 10
    pdf.setDrawColor(220, 220, 220)
    pdf.line(15, yPosition, pageWidth - 15, yPosition)
    yPosition += 10

    // Metrics Section
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Performance Metrics', 15, yPosition)
    yPosition += 8

    // Metrics in 2 columns
    const metricsPerRow = 2
    const metricBoxWidth = (pageWidth - 40) / metricsPerRow
    const metricBoxHeight = 20

    metrics.forEach((metric, index) => {
      const col = index % metricsPerRow
      const row = Math.floor(index / metricsPerRow)
      const xPos = 15 + (col * metricBoxWidth) + (col * 5)
      const yPos = yPosition + (row * (metricBoxHeight + 5))

      // Metric box
      pdf.setDrawColor(220, 220, 220)
      pdf.setFillColor(250, 250, 250)
      pdf.rect(xPos, yPos, metricBoxWidth, metricBoxHeight, 'FD')

      // Metric label
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(metric.label, xPos + 5, yPos + 6)

      // Metric value
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(String(metric.value), xPos + 5, yPos + 13)

      // Change indicator
      if (metric.change) {
        pdf.setFontSize(8)
        const isPositive = metric.change.includes('+') || metric.change.includes('↑')
        const [r, g, b] = isPositive ? [16, 185, 129] : [239, 68, 68]
        pdf.setTextColor(r, g, b)
        pdf.text(metric.change, xPos + 5, yPos + 17)
      }
    })

    yPosition += Math.ceil(metrics.length / metricsPerRow) * (metricBoxHeight + 5) + 10

    // Chart Section
    const chartElement = document.getElementById(chartElementId)
    if (chartElement && yPosition < pageHeight - 80) {
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Performance Chart', 15, yPosition)
      yPosition += 5

      try {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = pageWidth - 30
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Check if we need a new page
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, Math.min(imgHeight, 100))
        yPosition += Math.min(imgHeight, 100) + 10
      } catch (error) {
        console.error('Chart capture failed:', error)
        yPosition += 10
      }
    }

    // Products Table
    if (products.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Top Products Performance', 15, yPosition)
      yPosition += 5

      // Table data
      const tableData = products.slice(0, 20).map(p => [
        (p.name || 'N/A').length > 30 ? (p.name || 'N/A').substring(0, 27) + '...' : (p.name || 'N/A'),
        p.asin || 'N/A',
        `$${(p.sales || 0).toLocaleString()}`,
        (p.units || p.unitsSold || 0).toLocaleString(),
        `$${(p.profit || p.netProfit || 0).toLocaleString()}`,
        `${p.margin || 0}%`
      ])

      autoTable(pdf, {
        startY: yPosition,
        head: [['Product', 'ASIN', 'Sales', 'Units', 'Profit', 'Margin']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [55, 65, 81],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 60 }, // Product name
          1: { cellWidth: 25 }, // ASIN
          2: { cellWidth: 25, halign: 'right' }, // Sales
          3: { cellWidth: 20, halign: 'right' }, // Units
          4: { cellWidth: 25, halign: 'right' }, // Profit
          5: { cellWidth: 20, halign: 'right' }  // Margin
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
          // Footer
          const pageCount = (pdf as any).internal.getNumberOfPages()
          pdf.setFontSize(8)
          pdf.setTextColor(150, 150, 150)
          pdf.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          )
          pdf.text('SellerGenix - AI-Powered Analytics', 15, pageHeight - 10)
        }
      })
    }

    // Download
    pdf.save(`${filename}-${Date.now()}.pdf`)
  } catch (error) {
    console.error('PDF export failed:', error)
    throw error
  }
}
