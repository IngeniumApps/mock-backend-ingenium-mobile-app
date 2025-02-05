import express, { NextFunction, Request, Response } from "express";
import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import cors from "cors";

// 🔹 **Konstante Token-Laufzeiten**
const ACCESS_TOKEN_LIFETIME = 60 * 1000; // 60 Sekunden
const REFRESH_TOKEN_LIFETIME = 5 * 60 * 1000; // 5 Minuten

// 🔹 **Konstante Basis-URL für ICAL**
const CALENDAR_BASE_URL = "http://localhost:8090/ilias/calendar.php?client_id=Ilias&token=";

// 🔹 **Enums & Interfaces**
enum Role {
  USER,
  ADMINISTRATOR
}

interface UserAddress {
  city: string;
  street: string;
  zipcode: string;
  country: string;
}

interface User {
  userID: number;
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  accountIsNotLocked: number;
  title: string;
  gender: string;
  email: string;
  institution: string;
  userAddress: UserAddress;
  role?: Role;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
}

interface Calendar {
  userID: number;
  hash: string;
  desiredCalendarNum: number;
  dataIcalFormatted: string;
}

interface Database {
  users: User[];
  calendar: { [userID: number]: Calendar };
}

// 🔹 **Datenbank initialisieren**
const adapter = new JSONFileSync<Database>("db.json");
const db = new LowSync<Database>(adapter, { users: [], calendar: {} });
db.read();

const app = express();
app.use(express.json());
app.use(cors());

// 🔹 **Hilfsfunktion zur Token-Erstellung**
const generateTokens = (userID: number) => {
  const now = Date.now();
  return {
    accessToken: `fake-jwt-token-${userID}-${now}`,
    refreshToken: `mock-refresh-token-${userID}-${now}`,
    accessTokenExpiresAt: now + ACCESS_TOKEN_LIFETIME,
    refreshTokenExpiresAt: now + REFRESH_TOKEN_LIFETIME,
  };
};

// 🔹 **Middleware zur Authentifizierung**
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Kein gültiges Token vorhanden" });
  }

  const token = authHeader.split(" ")[1];
  const user = db.data?.users.find((u) => token.startsWith(`fake-jwt-token-${u.userID}`));

  if (!user || !user.accessTokenExpiresAt || Date.now() > user.accessTokenExpiresAt) {
    return res.status(401).json({ message: "Access Token ist abgelaufen oder ungültig" });
  }

  // 🔹 **Speichere den User in `req` für spätere Nutzung**
  (req as any).user = user;
  next();
};

// 🔹 **LOGIN**
app.post("/ingeapp/api/v1/auth/authenticate", (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = db.data?.users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Ungültige Zugangsdaten" });
  }

  console.log(`🔑 Login erfolgreich für User ${user.username}`);

  const tokens = generateTokens(user.userID);
  user.refreshToken = tokens.refreshToken;
  user.accessTokenExpiresAt = tokens.accessTokenExpiresAt;
  user.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
  db.write();

  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userID: user.userID,
    expiresAt: tokens.accessTokenExpiresAt,
  });
});

// 🔹 **TOKEN REFRESH mit Rotation (Best Practice 2025)**
app.post("/ingeapp/api/v1/auth/refresh", (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const user = db.data?.users.find((u) => u.refreshToken === refreshToken);

  if (!user) {
    console.log("🚨 Ungültiges Refresh Token!");
    return res.status(401).json({ message: "Ungültiges Refresh Token" });
  }

  if (!user.refreshTokenExpiresAt || Date.now() > user.refreshTokenExpiresAt) {
    console.log("⏳ Refresh Token abgelaufen.");
    return res.status(401).json({ message: "Refresh Token abgelaufen, bitte erneut einloggen" });
  }

  console.log(`🔄 Refresh für User ${user.username}`);

  // **Erzeuge neues Token-Paar**
  const tokens = generateTokens(user.userID);

  // **Altes Refresh Token invalidieren (Rotation)**
  user.refreshToken = tokens.refreshToken;
  user.accessTokenExpiresAt = tokens.accessTokenExpiresAt;
  user.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
  db.write();

  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.accessTokenExpiresAt,
  });
});

// 🔹 **GET USER DATA ENDPOINT (Protected)**
app.get("/ingeapp/api/v1/user/getUserData/:userID", authenticate, (req: Request, res: Response) => {
  const user = (req as any).user; // Hole den User aus der Middleware
  res.json(user);
});

// 🔹 **GET ICAL DATA ENDPOINT (Protected)**
app.get("/ingeapp/api/v1/user/getIcalData/:userID", authenticate, (req: Request, res: Response) => {
  const userID = (req as any).user.userID;
  const calendar = db.data?.calendar[userID];

  if (calendar) {
    res.json(calendar);
  } else {
    res.status(404).json({ message: "Keine Kalenderdaten gefunden" });
  }
});

// 🔹 **GET ICAL URL ENDPOINT (Protected)**
app.get("/ingeapp/api/v1/user/getIcalUrl/:userID", authenticate, (req: Request, res: Response) => {
  const userID = (req as any).user.userID;
  const calendar = db.data?.calendar[userID];

  if (calendar) {
    const url = CALENDAR_BASE_URL + calendar.hash;
    res.json({ userID, url });
  } else {
    res.status(404).json({ message: "ICAL-URL nicht gefunden" });
  }
});

// 🔹 **Starte den Server**
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Mock-Server läuft auf http://localhost:${PORT}`);
});