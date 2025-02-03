# Mock Backend API

Dieses Projekt ist ein einfaches Mock-Backend für die Ingenium-App. Es stellt API-Endpunkte zur Verfügung, um Benutzeranmeldungen, Kalenderdaten und iCal-URLs zu simulieren.

## 📌 Voraussetzungen

- **Node.js** (Version 16 oder höher empfohlen)
- **npm** (Node Package Manager)
- **Postman** (zum Testen der API, optional)

## 🚀 Installation

1. **Repository klonen oder Dateien speichern:**
   ```bash
   git clone https://github.com/IngeniumApps/mock-backend-ingenium-mobile-app.git
   cd mock-backend
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

## 🔥 Server starten

**Zum Starten des Servers einfach ausführen:**
```bash
npm run start
```
Oder direkt mit Node:
```bash
node dist/server.js
```

Falls der Server vorher gebaut werden muss, dann:
```bash
npm run build && npm run start
```
Oder direkt mit TypeScript:

```bash
npx tsc --build --force
```

Der Server läuft dann unter:  
📡 **http://localhost:3001**

## 📡 API-Endpunkte

### **🔑 Authentifizierung**
- **Login** (`POST /ingeapp/api/v1/auth/authenticate`)
- **Refresh Token** (`POST /ingeapp/api/v1/auth/refresh`)

### **👤 Benutzerdaten**
- **User-Info abrufen** (`GET /ingeapp/api/v1/user/getUserData/:userID`)

### **📅 Kalender & ICAL**
- **Kalenderdaten abrufen** (`GET /ingeapp/api/v1/user/getIcalData/:userID`)
- **iCal-URL abrufen** (`GET /ingeapp/api/v1/user/getIcalUrl/:userID`)

## 🛠 Entwicklung

Falls Änderungen am Code vorgenommen wurden, muss der TypeScript-Code neu kompiliert werden:
```bash
npx tsc --build --force
```

Danach den Server erneut starten.

## 🔍 Postman Collection
Zum einfachen Testen gibt es eine **Postman Collection**:
- Stelle sicher, dass die **Mock Backend**-Umgebung aktiv ist.
- Führe **den Login aus**, um `auth_token` & `refresh_token` zu speichern.
- Teste andere API-Endpunkte mit den gespeicherten Token.

## 📝 Datenbank (`db.json`)
Die Datenbank wird in einer JSON-Datei gespeichert und kann direkt editiert werden.
Falls Änderungen vorgenommen werden, muss der Server neu gestartet werden:
```bash
npm run start
```

---
