using System;
using Microsoft.Data.SqlClient;

var masterConn = "Server=localhost;Database=master;User Id=sa;Password=Pas$word!39;TrustServerCertificate=True;";
var dbName = "liga_dev";

using var conn = new SqlConnection(masterConn);
conn.Open();
using var cmd = conn.CreateCommand();
cmd.CommandText = $"""
    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'{dbName}')
        CREATE DATABASE [{dbName}];
    """;
cmd.ExecuteNonQuery();
Console.WriteLine($"Base de datos {dbName} lista.");
