public abstract class Investment
{
    public string Id { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } // Stock, Bond, MutualFund
    public string TransactionType { get; set; } // Buy or Sell
}

public class StockInvestment : Investment
{
    public string StockName { get; set; }
    public string DematAccount { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public int NumberOfShares { get; set; }
    public double? Brokerage { get; set; }
    public string BrokerageType { get; set; }
    public double? PurchasePrice { get; set; }
    public DateTime? SellDate { get; set; }
    public double? SellPrice { get; set; }
}

public class BondInvestment : Investment
{
    public string FixedIncomeName { get; set; }
    public DateTime? InvestmentDate { get; set; }
    public double? InvestmentAmount { get; set; }
    public double? CouponRate { get; set; }
    public string CompoundingFrequency { get; set; }
    public string InterestType { get; set; }
    public DateTime? MaturityDate { get; set; }
    public double? SellPrice { get; set; } // Add this
    public DateTime? SellDate { get; set; } // Add this
}

public class MutualFundInvestment : Investment
{
    public string SchemeName { get; set; }
    public string FolioNumber { get; set; }
    public DateTime? InvestmentDate { get; set; }
    public string AmountType { get; set; }
    public double? Amount { get; set; }
    public double? Price { get; set; }
    public double? SellPrice { get; set; }
}