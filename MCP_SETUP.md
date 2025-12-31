# 🔌 MCP (Model Context Protocol) Beállítási Útmutató

## 🎯 Mi az MCP?

A **Model Context Protocol (MCP)** egy nyílt szabvány, amelyet az Anthropic fejlesztett ki (2024 november), és amely lehetővé teszi, hogy az LLM-ek (pl. Claude) közvetlenül kommunikáljanak API-kkal és adatbázisokkal strukturált módon.

**Előnyök:**
- ✅ Közvetlen hozzáférés az Appwrite adatbázishoz természetes nyelven
- ✅ Automatikus dokumentáció elérés
- ✅ Nincs szükség manuális API hívásokra
- ✅ Valós idejű adatlekérdezések

---

## 🚀 Appwrite MCP Szerverek

### 1️⃣ **Appwrite API MCP** (Adatbázis hozzáférés)

Ez a szerver közvetlen hozzáférést biztosít az Appwrite backend-edhez:
- Databases (gyűjtemények, dokumentumok)
- Users (felhasználók kezelése)
- Functions (felhő funkciók)
- Teams (csapatok)
- Storage (fájlok)

### 2️⃣ **Appwrite Docs MCP** (Dokumentáció hozzáférés)

Ez a szerver az Appwrite dokumentációhoz ad hozzáférést:
- SDK példák (JavaScript, Python, stb.)
- API referenciák
- Útmutatók

---

## 📋 Előfeltételek

### Python telepítése (Appwrite API MCP-hez)

```bash
# Windows - Python letöltése
# https://www.python.org/downloads/

# Vagy Chocolatey-vel:
choco install python

# Vagy winget-tel:
winget install Python.Python.3.12

# Ellenőrzés:
python --version
```

### UV telepítése (Python package manager)

```bash
# Windows:
pip install uv

# Vagy:
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Node.js telepítve van? (Appwrite Docs MCP-hez)

```bash
node --version  # Már telepítve: v20.18.1
npm --version   # Már telepítve: 10.8.2
```

---

## 🔧 Beállítás

### 1️⃣ API Key Generálása

**FONTOS:** Az Appwrite API MCP működéséhez szükség van egy API Key-re!

1. **Appwrite Console megnyitása:**
   - Menj: https://appwrite.tsada.edu.rs
   - Jelentkezz be admin fiókkal

2. **API Key létrehozása:**
   - Settings → API Keys
   - "Add API Key"
   - **Name:** "MCP Server Key"
   - **Scopes:** Válaszd ki, amit Claude-nak engedélyezel:
     ```
     ✅ databases.read
     ✅ databases.write
     ✅ documents.read
     ✅ documents.write
     ✅ collections.read
     ✅ users.read (opcionális)
     ✅ teams.read (opcionális)
     ✅ functions.read (opcionális)
     ✅ buckets.read (opcionális)
     ✅ files.read (opcionális)
     ```
   - **Expiration:** Never (vagy állíts be dátumot)
   - **Create**

3. **API Key másolása:**
   - Másold ki a generált API Key-t (csak egyszer látod!)
   - Példa: `6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p`

### 2️⃣ MCP Config Frissítése

Nyisd meg: `.claude/mcp.json`

```json
{
  "mcpServers": {
    "appwrite-api": {
      "command": "uvx",
      "args": ["mcp-server-appwrite"],
      "env": {
        "APPWRITE_ENDPOINT": "https://appwrite.tsada.edu.rs/v1",
        "APPWRITE_PROJECT_ID": "659ea7f886cf55d4528a",
        "APPWRITE_API_KEY": "ITT_A_TE_API_KEY-ED"  // <- IDE MÁSOLD BE!
      },
      "description": "Appwrite API MCP server"
    },
    "appwrite-docs": {
      "command": "npx",
      "args": ["-y", "@smithery/mcp-server-appwrite-docs"],
      "description": "Appwrite documentation MCP server"
    }
  }
}
```

**⚠️ Cseréld ki:** `YOUR_API_KEY_HERE` → A te API key-ed

### 3️⃣ Claude Code Újraindítása

Miután frissítetted az MCP konfigot:

1. **VSCode bezárása** (teljesen)
2. **VSCode újranyitása**
3. **Claude Code extension újratöltése**

---

## ✅ Tesztelés

### Appwrite API MCP Tesztelése

Claude-nak ezt kérd:

```
"Listázd ki az összes gyűjteményt az Appwrite adatbázisból (658d3bb1c4785b1fad28)"
```

Ha működik, Claude hozzá tud férni az Appwrite-hoz és ki tudja listázni a collections-öket.

### Appwrite Docs MCP Tesztelése

Claude-nak ezt kérd:

```
"Keress rá az Appwrite dokumentációban, hogyan kell push notificationt küldeni"
```

Ha működik, Claude automatikusan elő tudja hozni a dokumentációt.

---

## 🐛 Hibaelhárítás

### "Session not found" hiba

**Ok:** Az MCP szerver nincs elindítva vagy nincs megfelelően konfigurálva.

**Megoldás:**
1. Ellenőrizd, hogy `uv` telepítve van-e: `uv --version`
2. Ellenőrizd, hogy az API Key helyes-e
3. Indítsd újra VSCode-ot

### "APPWRITE_API_KEY is required"

**Ok:** Nincs beállítva az API Key.

**Megoldás:** Add hozzá az API Key-t az `.claude/mcp.json` fájlhoz (lásd fent).

### "uvx: command not found"

**Ok:** UV nincs telepítve.

**Megoldás:**
```bash
pip install uv
# vagy
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Appwrite Docs MCP nem működik

**Próbáld meg manuálisan:**
```bash
npx -y @smithery/mcp-server-appwrite-docs
```

Ha ez sem működik, lehet, hogy a csomag neve változott. Nézd meg:
- https://github.com/smithery-ai/mcp-3
- https://appwrite.io/docs/tooling/mcp/docs

---

## 📚 MCP Használat Claude-dal

### Példák:

**1. Adatbázis lekérdezés:**
```
"Hozd ki az összes hírt a news_db gyűjteményből"
```

**2. Dokumentum létrehozása:**
```
"Hozz létre egy új hírt a news_db-ben, cím: 'Teszt hír', tartalom: 'Ez egy teszt'"
```

**3. Dokumentáció keresés:**
```
"Keress példát az Appwrite dokumentációban arra, hogyan kell fájlt feltölteni Storage-ba"
```

**4. Gyűjtemény sémájának lekérése:**
```
"Nézd meg a workers collection sémáját és mondd el, milyen mezői vannak"
```

---

## 🔒 Biztonság

**⚠️ FIGYELEM:**

1. **Ne commitold az API Key-t Git-be!**
   - Add hozzá `.gitignore`-hoz: `.claude/mcp.json`

2. **Korlátozott scope-ok:**
   - Csak a szükséges engedélyeket add meg az API Key-nek
   - Ne adj `*.delete` jogokat, ha nem szükséges

3. **Expiration:**
   - Állíts be lejárati dátumot az API Key-re

4. **Rotate API Keys:**
   - Időnként változtasd meg az API Key-t

---

## 🎉 Következő Lépések

Miután az MCP működik, Claude képes lesz:

✅ **Közvetlenül olvasni** az Appwrite adatbázist
✅ **Dokumentumokat létrehozni/frissíteni**
✅ **Gyűjtemények sémáját elemezni**
✅ **Appwrite dokumentációt automatikusan előhozni**
✅ **Kód példákat generálni** valós adatokkal

**Ez HATALMAS produktivitás növekedést jelent!** 🚀

---

## 📖 További Források

- [Appwrite MCP Dokumentáció](https://appwrite.io/docs/tooling/mcp)
- [MCP GitHub Repository](https://github.com/appwrite/mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Smithery MCP Registry](https://smithery.ai/mcp)

---

**Készítette:** Claude AI Assistant
**Utolsó frissítés:** 2025-12-13
