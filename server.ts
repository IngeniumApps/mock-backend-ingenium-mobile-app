import express, { Request, Response } from "express";
import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import cors from "cors";

// ✅ Typen für die Datenbank
interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string;
  refreshToken?: string; // Jeder User hat jetzt ein refreshToken
}

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
}

interface Database {
  users: User[];
  calendar: { [userID: number]: CalendarEvent[] };
  icalUrls: { [userID: number]: string };
}

// ✅ Datenbank initialisieren mit Default-Daten
const adapter = new JSONFileSync<Database>("db.json");
const db = new LowSync<Database>(adapter, { users: [], calendar: {}, icalUrls: {} });
db.read();

const app = express();
app.use(express.json());
app.use(cors());

// 🔹 **LOGIN ENDPOINT** - Erstellt ein neues Refresh-Token für den User
app.post("/ingeapp/api/v1/auth/authenticate", (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = db.data?.users.find((u: User) => u.username === username && u.password === password);

  if (user) {
    const newRefreshToken = `mock-refresh-token-${Date.now()}`; // Neues Token generieren
    user.refreshToken = newRefreshToken; // Speichern im User-Objekt
    db.write(); // Datenbank speichern ✅

    res.json({
      accessToken: `fake-jwt-token-${user.id}`,
      refreshToken: newRefreshToken,
      userID: user.id
    });
  } else {
    res.status(401).json({ message: "Ungültige Zugangsdaten" });
  }
});

// 🔹 **REFRESH TOKEN ENDPOINT** - Prüft das Refresh-Token des Users
app.post("/ingeapp/api/v1/auth/refresh", (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const user = db.data?.users.find((u: User) => u.refreshToken === refreshToken);
  if (!user) {
    return res.status(401).json({ message: "Ungültiges Refresh Token" });
  }

  const newAccessToken = `fake-jwt-token-${Date.now()}`;
  const newRefreshToken = `mock-refresh-token-${Date.now()}`; // Neues Token generieren
  user.refreshToken = newRefreshToken; // Speichern im User-Objekt
  db.write(); // ✅ Datenbank aktualisieren

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

// 🔹 **GET USER DATA ENDPOINT**
app.get("/ingeapp/api/v1/user/getUserData/:userID", (req: Request, res: Response) => {
  const userID = parseInt(req.params.userID, 10);
  const user = db.data?.users.find((u: User) => u.id === userID);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "Benutzer nicht gefunden" });
  }
});

// 🔹 **GET CALENDAR DATA ENDPOINT**
app.get("/ingeapp/api/v1/user/getIcalData/:userID", (req: Request, res: Response) => {
  const userID = parseInt(req.params.userID, 10);
  const calendar = db.data?.calendar[userID];

  if (calendar) {
    res.json({ userID, events: calendar });
  } else {
    res.status(404).json({ message: "Keine Kalenderdaten gefunden" });
  }
});

// 🔹 **GET ICAL URL ENDPOINT**
app.get("/ingeapp/api/v1/user/getIcalUrl/:userID", (req: Request, res: Response) => {
  const userID = parseInt(req.params.userID, 10);
  const icalUrl = db.data?.icalUrls[userID];

  if (icalUrl) {
    res.json({ userID, url: icalUrl });
  } else {
    res.status(404).json({ message: "ICAL-URL nicht gefunden" });
  }
});

// ✅ **Starte den Server**
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Mock-Server läuft auf http://localhost:${PORT}`);
});
