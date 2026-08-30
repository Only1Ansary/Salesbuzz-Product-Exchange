using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Deltas;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using SalesBuzz.Shared.Filters;
using SalesBuzzProductExchangeApi.Data;
using SalesBuzzProductExchangeApi.Models;

namespace SalesBuzzProductExchangeApi.Controllers;

// OData entity set rooted at /ProductExchangeOrders (empty-prefix route registered by
// AddSalesBuzzOData in Program.cs). Standard action names (Get/Post/Patch/Delete) map
// to the OData CRUD verbs via conventional routing, so URLs like
// /ProductExchangeOrders?$filter=Status eq 'Pending'&$orderby=Date desc&$top=10 work.
public class ProductExchangeOrdersController : ODataController
{
    private const string SecurityKey = "ProductExchange";

    private readonly ProductExchangeDbContext _db;
    public ProductExchangeOrdersController(ProductExchangeDbContext db) => _db = db;

    [EnableQuery(MaxTop = 1000)]
    [HasPermission(SecurityKey, PermissionKind.Read)]
    public IActionResult Get()
        => Ok(_db.ProductExchangeOrders.AsQueryable());

    [EnableQuery(MaxTop = 1000)]
    [HasPermission(SecurityKey, PermissionKind.Read)]
    public IActionResult Get(int key)
    {
        var order = _db.ProductExchangeOrders.Find(key);
        return order is null ? NotFound() : Ok(order);
    }

    [HasPermission(SecurityKey, PermissionKind.Create)]
    public IActionResult Post([FromBody] ProductExchangeOrder order)
    {
        order.Date = DateTime.UtcNow;
        _db.ProductExchangeOrders.Add(order);
        _db.SaveChanges();
        return Created(order);
    }

    [HasPermission(SecurityKey, PermissionKind.Update)]
    public IActionResult Patch(int key, [FromBody] Delta<ProductExchangeOrder> patch)
    {
        var order = _db.ProductExchangeOrders.Find(key);
        if (order is null) return NotFound();

        patch.Patch(order);
        _db.SaveChanges();
        return Updated(order);
    }

    [HasPermission(SecurityKey, PermissionKind.Delete)]
    public IActionResult Delete(int key)
    {
        var order = _db.ProductExchangeOrders.Find(key);
        if (order is null) return NotFound();

        _db.ProductExchangeOrders.Remove(order);
        _db.SaveChanges();
        return NoContent();
    }
}