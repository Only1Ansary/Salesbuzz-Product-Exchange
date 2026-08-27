using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesBuzz.Shared.Filters;
using SalesBuzzProductExchangeApi.Data;
using SalesBuzzProductExchangeApi.Models;

namespace SalesBuzzProductExchangeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductExchangeController : ControllerBase
{
    // The security key (KeyID) in HH_SA_SecurityKeys / HH_SA_RolePermissions
    // that governs this module's CRUD permissions.
    private const string SecurityKey = "ProductExchange";

    private readonly ProductExchangeDbContext _db;
    public ProductExchangeController(ProductExchangeDbContext db) => _db = db;

    // GET api/ProductExchange   -> populate the grid
    [HttpGet]
    [HasPermission(SecurityKey, PermissionKind.Read)]
    public async Task<ActionResult<IEnumerable<ProductExchangeOrder>>> GetOrders()
        => Ok(await _db.ProductExchangeOrders.OrderByDescending(o => o.Date).ToListAsync());

    // GET api/ProductExchange/5
    [HttpGet("{id}")]
    [HasPermission(SecurityKey, PermissionKind.Read)]
    public async Task<ActionResult<ProductExchangeOrder>> GetOrder(int id)
    {
        var order = await _db.ProductExchangeOrders.FindAsync(id);
        return order is null ? NotFound() : Ok(order);
    }

    // POST api/ProductExchange   -> "Add" button
    [HttpPost]
    [HasPermission(SecurityKey, PermissionKind.Create)]
    public async Task<ActionResult<ProductExchangeOrder>> AddOrder(ProductExchangeOrder order)
    {
        order.Date = DateTime.UtcNow;
        _db.ProductExchangeOrders.Add(order);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetOrder), new { id = order.OrderId }, order);
    }

    // PATCH api/ProductExchange/5   -> double-click-a-field edit
    // body example: [{ "op": "replace", "path": "/status", "value": "Approved" }]
    [HttpPatch("{id}")]
    [HasPermission(SecurityKey, PermissionKind.Update)]
    public async Task<ActionResult<ProductExchangeOrder>> EditOrder(
        int id, [FromBody] JsonPatchDocument<ProductExchangeOrder> patch)
    {
        var order = await _db.ProductExchangeOrders.FindAsync(id);
        if (order is null) return NotFound();

        patch.ApplyTo(order, ModelState);
        if (!ModelState.IsValid) return BadRequest(ModelState);

        await _db.SaveChangesAsync();
        return Ok(order);
    }

    // DELETE api/ProductExchange/5   -> "Delete" button
    [HttpDelete("{id}")]
    [HasPermission(SecurityKey, PermissionKind.Delete)]
    public async Task<IActionResult> DeleteOrder(int id)
    {
        var order = await _db.ProductExchangeOrders.FindAsync(id);
        if (order is null) return NotFound();

        _db.ProductExchangeOrders.Remove(order);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}