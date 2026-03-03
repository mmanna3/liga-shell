# Liga

## Base de datos dev (liga_dev)

Si tras los tests E2E o por otro motivo falla la conexión a la BD (`Cannot open database "liga_dev"`), ejecutá:

```bash
bash scripts/restaurar-bd-dev.sh
```

Luego `dotnet run --project liga-be/Api`. Requiere Docker con SQL Server (`liga-localhost`) corriendo.

## Agregar liga nueva

### En Plesk

1. Crear dominio/subdominio en Plesk
2. Habilitar HTTPS (con Let's Encrypt)
3. Web Application Firewall -> Detection only (si no, no andan ni PUT ni POST)
4. Crear base de datos con nombre `liga_[nombre-liga]` enganchada al dominio/subdominio
5. Agregar carpeta wwwroot dentro del dominio *(no estoy seguro si es necesario)*

### En repo back

5. Crear environment con variables de entorno en repo back (archivo liga.com.ar (ligas) del Drive)
6. Actualizar `deploy.yml` agregando el environment creado al array

### En repo front

7. Crear environment con variables de entorno en repo front
8. Actualizar `gh-pages.yml` agregando el environment creado al array
