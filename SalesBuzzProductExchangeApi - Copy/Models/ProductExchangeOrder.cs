using System.ComponentModel.DataAnnotations;

namespace SalesBuzzProductExchangeApi.Models;

public class ProductExchangeOrder
{
    [Key]
    public int OrderId { get; set; }
    public string OriginalProduct { get; set; } = "";
    public int OriginalQuantity { get; set; }
    public string ReplacementProduct { get; set; } = "";
    public int ReplacementQuantity { get; set; }
    public string Reason { get; set; } = "";
    public string Status { get; set; } = "Pending";
    public DateTime Date { get; set; }
}