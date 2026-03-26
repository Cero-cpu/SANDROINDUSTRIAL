# 🔐 Credenciales del Sistema — Sandro Industrial

## Acceso Administrador

| Campo          | Valor                          |
|----------------|-------------------------------|
| **Usuario**    | `admin@sandroindustrial.com`  |
| **Contraseña** | `admin123`                    |
| **Rol**        | Administrador                 |

---

## 🐳 Iniciar con Docker (Producción — Recomendado)

> Solo necesitas hacer esto **una vez**. Después el sistema arranca solo con un comando.

### Primera vez — Configurar base de datos

```bash
cd /home/julian/Documents/Industrial/Invoice-System-Pro

# 1. Construir e iniciar todos los contenedores
docker compose up --build -d

# 2. Esperar ~10 segundos a que la base de datos esté lista, luego ejecutar seed:
export DATABASE_URL="postgresql://sandro:sandro2024@localhost:5432/sandro_db"
npx --yes tsx@latest scripts/src/seed.ts
```

### Desde la segunda vez en adelante

```bash
cd /home/julian/Documents/Industrial/Invoice-System-Pro
docker compose up -d
```

### Acceder al sistema

Abre tu navegador y entra a:

👉 **http://localhost:8080**

---

## 🛑 Apagar el sistema

```bash
docker compose down
```

## 🔄 Actualizar el sistema (si hay cambios en el código)

```bash
docker compose up --build -d
```

---

## Base de datos Docker (Credenciales internas)

| Campo          | Valor        |
|----------------|--------------|
| **Host**       | localhost    |
| **Puerto**     | 5432         |
| **Base**       | sandro_db    |
| **Usuario**    | sandro       |
| **Contraseña** | sandro2024   |

---

## 💻 Desarrollo local (sin Docker)

```bash
cd /home/julian/Documents/Industrial/Invoice-System-Pro

# Iniciar la base de datos Docker (si no está corriendo)
docker start sandro_db

export DATABASE_URL="postgresql://sandro:sandro2024@localhost:5432/sandro_db"
npx pnpm run dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:5000
