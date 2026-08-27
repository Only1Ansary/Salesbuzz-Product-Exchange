using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesBuzzProductExchangeApi.Migrations
{
    /// <inheritdoc />
    public partial class Fixing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            
            migrationBuilder.CreateTable(
                name: "ProductExchangeOrders",
                columns: table => new
                {
                    OrderId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OriginalProduct = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OriginalQuantity = table.Column<int>(type: "int", nullable: false),
                    ReplacementProduct = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReplacementQuantity = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductExchangeOrders", x => x.OrderId);
                });

            
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditCriteria");

            migrationBuilder.DropTable(
                name: "BS_Periods");

            migrationBuilder.DropTable(
                name: "BS_Years");

            migrationBuilder.DropTable(
                name: "HH_AR_SalesmenCats");

            migrationBuilder.DropTable(
                name: "HH_AR_SalesmenPcts");

            migrationBuilder.DropTable(
                name: "HH_Customer");

            migrationBuilder.DropTable(
                name: "HH_CustomerLocations");

            migrationBuilder.DropTable(
                name: "HH_EntityBUControl");

            migrationBuilder.DropTable(
                name: "HH_IC_UOMDetail");

            migrationBuilder.DropTable(
                name: "HH_Item");

            migrationBuilder.DropTable(
                name: "HH_ItemUoms");

            migrationBuilder.DropTable(
                name: "HH_Messages");

            migrationBuilder.DropTable(
                name: "HH_PARAMS");

            migrationBuilder.DropTable(
                name: "HH_PARAMS_BU");

            migrationBuilder.DropTable(
                name: "HH_SA_BU");

            migrationBuilder.DropTable(
                name: "HH_SA_RolePermissions");

            migrationBuilder.DropTable(
                name: "HH_SA_Roles");

            migrationBuilder.DropTable(
                name: "HH_SA_SecurityKeys");

            migrationBuilder.DropTable(
                name: "HH_SA_UserBUPermissions");

            migrationBuilder.DropTable(
                name: "HH_Salesman");

            migrationBuilder.DropTable(
                name: "hh_ST_NumberSequance");

            migrationBuilder.DropTable(
                name: "hh_ST_NumberSequanceCanceledSerials");

            migrationBuilder.DropTable(
                name: "hh_ST_NumberSequanceCanceledSerialsBU");

            migrationBuilder.DropTable(
                name: "hh_ST_NumberSequenceBU");

            migrationBuilder.DropTable(
                name: "hh_Target");

            migrationBuilder.DropTable(
                name: "loginusers");

            migrationBuilder.DropTable(
                name: "ProductExchangeOrders");

            migrationBuilder.DropTable(
                name: "RecordLevelSecurity");

            migrationBuilder.DropTable(
                name: "SA_AuditLogs");

            migrationBuilder.DropTable(
                name: "SA_License");

            migrationBuilder.DropTable(
                name: "SA_Sessions");

            migrationBuilder.DropTable(
                name: "ST_EventDefinition");

            migrationBuilder.DropTable(
                name: "ST_EventLogDetail");

            migrationBuilder.DropTable(
                name: "ST_EventLogMaster");
        }
    }
}
