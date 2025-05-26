using System.Text.Json;
using System.Text.Json.Serialization;

public class InvestmentJsonConverter : JsonConverter<Investment>
{
    public override Investment Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var doc = JsonDocument.ParseValue(ref reader);
        var type = doc.RootElement.GetProperty("Type").GetString();

        return type switch
        {
            "Stock" => JsonSerializer.Deserialize<StockInvestment>(doc.RootElement.GetRawText(), options),
            "Bond" => JsonSerializer.Deserialize<BondInvestment>(doc.RootElement.GetRawText(), options),
            "MutualFund" => JsonSerializer.Deserialize<MutualFundInvestment>(doc.RootElement.GetRawText(), options),
            _ => throw new JsonException("Unknown investment type")
        };
    }

    public override void Write(Utf8JsonWriter writer, Investment value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, (object)value, value.GetType(), options);
    }
}
