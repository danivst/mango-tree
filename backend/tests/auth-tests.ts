// @ts-nocheck

import * as authController from "../src/controllers/auth/auth-main-controller";
import RoleTypeValue from "../src/enums/role-type";
import LanguageTypeValue from "../src/enums/language-type";

jest.mock("../src/utils/logger");
jest.mock("../src/utils/disposable-email", () => ({
  isDisposableEmail: jest.fn().mockReturnValue(false),
}));
jest.mock("../src/utils/activity-logger", () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../src/utils/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../src/utils/translation", () => ({
  getDualTranslation: jest.fn().mockResolvedValue({ en: "translated", bg: "prevedeno" }),
}));
jest.mock("../src/utils/get-translation", () => ({
  getLocalizedText: jest.fn((lang, value) => value[lang] || value.en),
}));
jest.mock("../src/utils/email-templates", () => ({
  getWelcomeEmailTemplate: jest.fn().mockReturnValue("<p>welcome</p>"),
  get2FAEmailTemplate: jest.fn().mockReturnValue("<p>2fa</p>"),
}));
jest.mock("../src/utils/auth-cookies", () => ({
  clearAuthCookies: jest.fn(),
  setAuthCookies: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("token"),
}));
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
  compare: jest.fn(),
}));
jest.mock("../src/models/banned-user-model", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockResolvedValue(null),
  },
}));
jest.mock("../src/models/notification-model", () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock("../src/models/user-model", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

import User from "../src/models/user-model";
import BannedUser from "../src/models/banned-user-model";
import { setAuthCookies } from "../src/utils/auth-cookies";

describe("Auth Controller - registerUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    BannedUser.findOne.mockResolvedValue(null);
    User.findOne.mockResolvedValue(null);
  });

  it("stores the selected language during signup", async () => {
    const createdUser = {
      _id: "user-1",
      username: "testuser",
      role: RoleTypeValue.USER,
      bio: "",
      language: LanguageTypeValue.BG,
      translations: { bio: { bg: "", en: "" } },
    };
    User.create.mockResolvedValue(createdUser);

    const req = {
      body: {
        username: "testuser",
        email: "test@example.com",
        password: "Password123!",
        language: LanguageTypeValue.BG,
      },
      headers: {},
      connection: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await authController.registerUser(req, res);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        language: LanguageTypeValue.BG,
      }),
    );
    expect(setAuthCookies).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("rejects unsupported signup languages", async () => {
    const req = {
      body: {
        username: "testuser",
        email: "test@example.com",
        password: "Password123!",
        language: "de",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await authController.registerUser(req, res);

    expect(User.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid language.",
      field: "language",
    });
  });
});
