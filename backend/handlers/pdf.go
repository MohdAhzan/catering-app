package handlers

import (
	"fmt"
	"net/http"
	"time"

	"catering-backend/models"

	"github.com/gin-gonic/gin"
	gofpdf "github.com/jung-kurt/gofpdf"
	"gorm.io/gorm"
)

type PDFHandler struct{ DB *gorm.DB }

func NewPDFHandler(db *gorm.DB) *PDFHandler { return &PDFHandler{DB: db} }

func (h *PDFHandler) SingleEventInvoice(c *gin.Context) {
	id := c.Param("id")
	var event models.Event
	if err := h.DB.Preload("Creator").Preload("BillingItems").Preload("Expenses.Creator").Preload("MiscExpenses.Creator").First(&event, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}
	enrichEvent(h.DB, &event)

	pdf := newBasePDF()
	writeSingleEventPDF(pdf, event)

	fname := fmt.Sprintf("Invoice_%s_%s.pdf", event.BillNumber, event.Date.Format("2006-01-02"))
	c.Header("Content-Disposition", "attachment; filename="+fname)
	c.Header("Content-Type", "application/pdf")
	c.Header("Access-Control-Expose-Headers", "Content-Disposition")
	pdf.Output(c.Writer)
}

func (h *PDFHandler) MultiEventInvoice(c *gin.Context) {
	var input struct {
		From string `json:"from" binding:"required"`
		To   string `json:"to" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fromTime, _ := time.Parse("2006-01-02", input.From)
	toTime, _ := time.Parse("2006-01-02", input.To)
	toTime = toTime.Add(24*time.Hour - time.Second)

	var events []models.Event
	h.DB.Where("date >= ? AND date <= ?", fromTime, toTime).Order("date ASC").
		Preload("BillingItems").Preload("Expenses").Preload("MiscExpenses").Find(&events)
	for i := range events {
		enrichEvent(h.DB, &events[i])
	}

	pdf := newBasePDF()
	writeMultiEventPDF(pdf, events, fromTime, toTime)

	fname := fmt.Sprintf("Report_%s_to_%s.pdf", input.From, input.To)
	c.Header("Content-Disposition", "attachment; filename="+fname)
	c.Header("Content-Type", "application/pdf")
	c.Header("Access-Control-Expose-Headers", "Content-Disposition")
	pdf.Output(c.Writer)
}

func newBasePDF() *gofpdf.Fpdf {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.SetAutoPageBreak(true, 20)
	pdf.AddPage()
	return pdf
}

func setFillRGB(pdf *gofpdf.Fpdf, r, g, b int) {
	pdf.SetFillColor(r, g, b)
}
func setTextRGB(pdf *gofpdf.Fpdf, r, g, b int) {
	pdf.SetTextColor(r, g, b)
}
func setDrawRGB(pdf *gofpdf.Fpdf, r, g, b int) {
	pdf.SetDrawColor(r, g, b)
}

func writeSingleEventPDF(pdf *gofpdf.Fpdf, event models.Event) {
	// Header
	setTextRGB(pdf, 13, 27, 42)
	pdf.SetFont("Helvetica", "B", 20)
	pdf.CellFormat(130, 10, "CATERING INVOICE", "", 0, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	setTextRGB(pdf, 100, 100, 100)
	pdf.CellFormat(60, 10, "Bill # "+event.BillNumber, "", 1, "R", false, 0, "")

	setDrawRGB(pdf, 13, 27, 42)
	pdf.SetLineWidth(0.5)
	pdf.Line(15, pdf.GetY(), 195, pdf.GetY())
	pdf.Ln(4)

	setTextRGB(pdf, 13, 27, 42)
	pdf.SetFont("Helvetica", "B", 14)
	pdf.CellFormat(190, 8, event.Name, "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	setTextRGB(pdf, 100, 100, 100)
	pdf.CellFormat(95, 6, "Date: "+event.Date.Format("January 2, 2006"), "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 6, "Location: "+event.Location, "", 1, "L", false, 0, "")
	if event.Creator.Name != "" {
		pdf.CellFormat(190, 6, "Manager: "+event.Creator.Name, "", 1, "L", false, 0, "")
	}
	pdf.Ln(5)

	// Billing Items Table
	if len(event.BillingItems) > 0 {
		setTextRGB(pdf, 13, 27, 42)
		pdf.SetFont("Helvetica", "B", 11)
		pdf.CellFormat(190, 7, "BILLING ITEMS", "", 1, "L", false, 0, "")

		// Table header
		pdf.SetFont("Helvetica", "B", 9)
		setFillRGB(pdf, 13, 27, 42)
		setTextRGB(pdf, 255, 255, 255)
		pdf.CellFormat(10, 6, "#", "1", 0, "C", true, 0, "")
		pdf.CellFormat(95, 6, "Item", "1", 0, "L", true, 0, "")
		pdf.CellFormat(20, 6, "Qty", "1", 0, "C", true, 0, "")
		pdf.CellFormat(32, 6, "Rate (Rs.)", "1", 0, "R", true, 0, "")
		pdf.CellFormat(33, 6, "Amount (Rs.)", "1", 1, "R", true, 0, "")

		pdf.SetFont("Helvetica", "", 9)
		var billingTotal float64
		for i, item := range event.BillingItems {
			fill := i%2 == 1
			if fill {
				setFillRGB(pdf, 245, 245, 245)
			} else {
				setFillRGB(pdf, 255, 255, 255)
			}
			setTextRGB(pdf, 15, 15, 15)
			pdf.CellFormat(10, 6, fmt.Sprintf("%d", i+1), "1", 0, "C", fill, 0, "")
			pdf.CellFormat(95, 6, item.ItemName, "1", 0, "L", fill, 0, "")
			pdf.CellFormat(20, 6, fmt.Sprintf("%.0f", item.Quantity), "1", 0, "C", fill, 0, "")
			pdf.CellFormat(32, 6, fmt.Sprintf("%.2f", item.Rate), "1", 0, "R", fill, 0, "")
			pdf.CellFormat(33, 6, fmt.Sprintf("%.2f", item.Amount), "1", 1, "R", fill, 0, "")
			billingTotal += item.Amount
		}
		pdf.SetFont("Helvetica", "B", 9)
		setFillRGB(pdf, 220, 235, 255)
		setTextRGB(pdf, 13, 27, 42)
		pdf.CellFormat(157, 6, "Total Billing", "1", 0, "R", true, 0, "")
		pdf.CellFormat(33, 6, fmt.Sprintf("Rs. %.2f", billingTotal), "1", 1, "R", true, 0, "")
		pdf.Ln(4)
	}

	// Expenses Table
	hasExpenses := len(event.Expenses) > 0 || len(event.MiscExpenses) > 0
	if hasExpenses {
		setTextRGB(pdf, 13, 27, 42)
		pdf.SetFont("Helvetica", "B", 11)
		pdf.CellFormat(190, 7, "EXPENSES", "", 1, "L", false, 0, "")

		pdf.SetFont("Helvetica", "B", 9)
		setFillRGB(pdf, 100, 60, 60)
		setTextRGB(pdf, 255, 255, 255)
		pdf.CellFormat(120, 6, "Description", "1", 0, "L", true, 0, "")
		pdf.CellFormat(37, 6, "Category", "1", 0, "C", true, 0, "")
		pdf.CellFormat(33, 6, "Amount (Rs.)", "1", 1, "R", true, 0, "")

		pdf.SetFont("Helvetica", "", 9)
		var expTotal float64
		for i, exp := range event.Expenses {
			fill := i%2 == 1
			if fill {
				setFillRGB(pdf, 245, 245, 245)
			} else {
				setFillRGB(pdf, 255, 255, 255)
			}
			setTextRGB(pdf, 15, 15, 15)
			pdf.CellFormat(120, 6, exp.Description, "1", 0, "L", fill, 0, "")
			pdf.CellFormat(37, 6, exp.Category, "1", 0, "C", fill, 0, "")
			pdf.CellFormat(33, 6, fmt.Sprintf("%.2f", exp.Amount), "1", 1, "R", fill, 0, "")
			expTotal += exp.Amount
		}
		for _, m := range event.MiscExpenses {
			setFillRGB(pdf, 255, 250, 225)
			setTextRGB(pdf, 15, 15, 15)
			label := m.Description
			if m.Note != "" {
				label += " (" + m.Note + ")"
			}
			pdf.CellFormat(120, 6, label, "1", 0, "L", true, 0, "")
			pdf.CellFormat(37, 6, "Miscellaneous", "1", 0, "C", true, 0, "")
			pdf.CellFormat(33, 6, fmt.Sprintf("%.2f", m.Amount), "1", 1, "R", true, 0, "")
			expTotal += m.Amount
		}
		pdf.SetFont("Helvetica", "B", 9)
		setFillRGB(pdf, 255, 220, 220)
		setTextRGB(pdf, 100, 30, 30)
		pdf.CellFormat(157, 6, "Total Expenses", "1", 0, "R", true, 0, "")
		pdf.CellFormat(33, 6, fmt.Sprintf("Rs. %.2f", expTotal), "1", 1, "R", true, 0, "")
		pdf.Ln(4)
	}

	// Summary
	pdf.SetLineWidth(0.5)
	setDrawRGB(pdf, 13, 27, 42)
	pdf.Line(15, pdf.GetY(), 195, pdf.GetY())
	pdf.Ln(4)

	pdf.SetFont("Helvetica", "B", 12)
	setTextRGB(pdf, 13, 27, 42)
	pdf.CellFormat(190, 8, "FINANCIAL SUMMARY", "", 1, "L", false, 0, "")

	pdf.SetFont("Helvetica", "", 10)
	setTextRGB(pdf, 60, 60, 60)
	pdf.CellFormat(140, 7, "Total Revenue", "", 0, "L", false, 0, "")
	pdf.CellFormat(50, 7, fmt.Sprintf("Rs. %.2f", event.TotalBilling), "", 1, "R", false, 0, "")
	pdf.CellFormat(140, 7, "Total Expenses (incl. misc)", "", 0, "L", false, 0, "")
	pdf.CellFormat(50, 7, fmt.Sprintf("Rs. %.2f", event.TotalExpenses+event.TotalMisc), "", 1, "R", false, 0, "")

	pdf.Ln(2)
	pdf.SetFont("Helvetica", "B", 12)
	pl := event.ProfitLoss
	if pl >= 0 {
		setFillRGB(pdf, 215, 245, 230)
		setTextRGB(pdf, 20, 100, 60)
	} else {
		setFillRGB(pdf, 250, 215, 215)
		setTextRGB(pdf, 150, 30, 30)
	}
	lbl := "NET PROFIT"
	if pl < 0 {
		lbl = "NET LOSS"
	}
	pdf.CellFormat(140, 9, lbl, "1", 0, "L", true, 0, "")
	pdf.CellFormat(50, 9, fmt.Sprintf("Rs. %.2f", pl), "1", 1, "R", true, 0, "")

	pdf.Ln(8)
	setTextRGB(pdf, 150, 150, 150)
	pdf.SetFont("Helvetica", "I", 8)
	pdf.CellFormat(190, 5, "Generated on "+time.Now().Format("January 2, 2006 at 15:04 MST"), "", 1, "C", false, 0, "")
}

func writeMultiEventPDF(pdf *gofpdf.Fpdf, events []models.Event, from, to time.Time) {
	pdf.SetFont("Helvetica", "B", 18)
	setTextRGB(pdf, 13, 27, 42)
	pdf.CellFormat(190, 10, "CATERING BUSINESS REPORT", "", 1, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	setTextRGB(pdf, 100, 100, 100)
	pdf.CellFormat(190, 6, fmt.Sprintf("Period: %s to %s", from.Format("January 2, 2006"), to.Format("January 2, 2006")), "", 1, "C", false, 0, "")
	pdf.Ln(3)
	setDrawRGB(pdf, 13, 27, 42)
	pdf.Line(15, pdf.GetY(), 195, pdf.GetY())
	pdf.Ln(5)

	// Table header
	pdf.SetFont("Helvetica", "B", 8)
	setFillRGB(pdf, 13, 27, 42)
	setTextRGB(pdf, 255, 255, 255)
	pdf.CellFormat(22, 6, "Date", "1", 0, "C", true, 0, "")
	pdf.CellFormat(62, 6, "Event Name", "1", 0, "L", true, 0, "")
	pdf.CellFormat(22, 6, "Bill #", "1", 0, "C", true, 0, "")
	pdf.CellFormat(28, 6, "Revenue", "1", 0, "R", true, 0, "")
	pdf.CellFormat(28, 6, "Expenses", "1", 0, "R", true, 0, "")
	pdf.CellFormat(28, 6, "P / L", "1", 1, "R", true, 0, "")

	pdf.SetFont("Helvetica", "", 8)
	var totalRev, totalExp float64
	for i, ev := range events {
		fill := i%2 == 1
		if fill {
			setFillRGB(pdf, 245, 245, 245)
		} else {
			setFillRGB(pdf, 255, 255, 255)
		}
		pl := ev.TotalBilling - ev.TotalExpenses - ev.TotalMisc
		setTextRGB(pdf, 15, 15, 15)
		pdf.CellFormat(22, 6, ev.Date.Format("02 Jan 06"), "1", 0, "C", fill, 0, "")
		pdf.CellFormat(62, 6, ev.Name, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(22, 6, ev.BillNumber, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(28, 6, fmt.Sprintf("%.2f", ev.TotalBilling), "1", 0, "R", fill, 0, "")
		pdf.CellFormat(28, 6, fmt.Sprintf("%.2f", ev.TotalExpenses+ev.TotalMisc), "1", 0, "R", fill, 0, "")
		if pl >= 0 {
			setTextRGB(pdf, 20, 100, 60)
		} else {
			setTextRGB(pdf, 150, 30, 30)
		}
		pdf.CellFormat(28, 6, fmt.Sprintf("%.2f", pl), "1", 1, "R", fill, 0, "")
		setTextRGB(pdf, 15, 15, 15)
		totalRev += ev.TotalBilling
		totalExp += ev.TotalExpenses + ev.TotalMisc
	}

	pdf.Ln(5)
	// Summary
	pdf.SetFont("Helvetica", "B", 11)
	setTextRGB(pdf, 13, 27, 42)
	pdf.CellFormat(190, 7, "CONSOLIDATED SUMMARY", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	setTextRGB(pdf, 60, 60, 60)
	pdf.CellFormat(140, 6, "Total Revenue", "", 0, "L", false, 0, "")
	pdf.CellFormat(50, 6, fmt.Sprintf("Rs. %.2f", totalRev), "", 1, "R", false, 0, "")
	pdf.CellFormat(140, 6, "Total Expenses", "", 0, "L", false, 0, "")
	pdf.CellFormat(50, 6, fmt.Sprintf("Rs. %.2f", totalExp), "", 1, "R", false, 0, "")
	pdf.Ln(2)
	net := totalRev - totalExp
	pdf.SetFont("Helvetica", "B", 12)
	if net >= 0 {
		setFillRGB(pdf, 215, 245, 230)
		setTextRGB(pdf, 20, 100, 60)
	} else {
		setFillRGB(pdf, 250, 215, 215)
		setTextRGB(pdf, 150, 30, 30)
	}
	lbl := "NET PROFIT"
	if net < 0 {
		lbl = "NET LOSS"
	}
	pdf.CellFormat(140, 9, lbl, "1", 0, "L", true, 0, "")
	pdf.CellFormat(50, 9, fmt.Sprintf("Rs. %.2f", net), "1", 1, "R", true, 0, "")
	pdf.Ln(8)
	setTextRGB(pdf, 150, 150, 150)
	pdf.SetFont("Helvetica", "I", 8)
	pdf.CellFormat(190, 5, "Generated on "+time.Now().Format("January 2, 2006 at 15:04 MST"), "", 1, "C", false, 0, "")
}
