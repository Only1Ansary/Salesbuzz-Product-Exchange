using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesBuzzProductExchangeApi.Data;
using SalesBuzzProductExchangeApi.Models;

namespace SalesBuzzProductExchangeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductExchangeController : ControllerBase
{
    private readonly ProductExchangeDbContext _db;
    public ProductExchangeController(ProductExchangeDbContext db) => _db = db;

    // GET api/ProductExchange   -> populate the grid
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductExchangeOrder>>> GetOrders()
        => Ok(await _db.ProductExchangeOrders.OrderByDescending(o => o.Date).ToListAsync());

    // GET api/ProductExchange/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductExchangeOrder>> GetOrder(int id)
    {
        var order = await _db.ProductExchangeOrders.FindAsync(id);
        return order is null ? NotFound() : Ok(order);
    }

    // POST api/ProductExchange   -> "Add" button
    [HttpPost]
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
    public async Task<IActionResult> DeleteOrder(int id)
    {
        var order = await _db.ProductExchangeOrders.FindAsync(id);
        if (order is null) return NotFound();

        _db.ProductExchangeOrders.Remove(order);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}