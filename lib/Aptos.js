"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var bip32_path_1 = __importDefault(require("bip32-path"));
var sha3_1 = require("@noble/hashes/sha3");
var errors_1 = require("@ledgerhq/errors");
var MAX_APDU_LEN = 255;
var P1_NON_CONFIRM = 0x00;
var P1_CONFIRM = 0x01;
var P1_START = 0x00;
var P2_MORE = 0x80;
var P2_LAST = 0x00;
var LEDGER_CLA = 0x5b;
var INS = {
    GET_VERSION: 0x03,
    GET_PUBLIC_KEY: 0x05,
    SIGN_TX: 0x06
};
/**
 * Aptos API
 *
 * @param transport a transport for sending commands to a device
 * @param scrambleKey a scramble key
 *
 * @example
 * import Aptos from "hw-app-Aptos";
 * const Aptos = new Aptos(transport);
 */
var Aptos = /** @class */ (function () {
    function Aptos(transport, 
    // the type annotation is needed for doc generator
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    scrambleKey) {
        if (scrambleKey === void 0) { scrambleKey = "Aptos"; }
        this.transport = transport;
        this.transport.decorateAppAPIMethods(this, ["getVersion", "getAddress"], scrambleKey);
    }
    /**
     * Get application version.
     *
     * @returns an object with the version field
     *
     * @example
     * Aptos.getVersion().then(r => r.version)
     */
    Aptos.prototype.getVersion = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, major, minor, patch;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.sendToDevice(INS.GET_VERSION, P1_NON_CONFIRM, P2_LAST, Buffer.alloc(0))];
                    case 1:
                        _a = __read.apply(void 0, [_b.sent(), 3]), major = _a[0], minor = _a[1], patch = _a[2];
                        return [2 /*return*/, {
                                version: "".concat(major, ".").concat(minor, ".").concat(patch)
                            }];
                }
            });
        });
    };
    /**
     * Get Aptos address (public key) for a BIP32 path.
     *
     * Because Aptos uses Ed25519 keypairs, as per SLIP-0010
     * all derivation-path indexes will be promoted to hardened indexes.
     *
     * @param path a BIP32 path
     * @param display flag to show display
     * @returns an object with publicKey, chainCode, address fields
     *
     * @example
     * Aptos.getAddress("m/44'/637'/1'/0'/0'").then(r => r.address)
     */
    Aptos.prototype.getAddress = function (path, 
    // the type annotation is needed for doc generator
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    display) {
        if (display === void 0) { display = false; }
        return __awaiter(this, void 0, void 0, function () {
            var pathBuffer, responseBuffer, offset, pubKeyLen, pubKeyBuffer, chainCodeLen, chainCodeBuffer, address;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pathBuffer = this.pathToBuffer(path);
                        return [4 /*yield*/, this.sendToDevice(INS.GET_PUBLIC_KEY, display ? P1_CONFIRM : P1_NON_CONFIRM, P2_LAST, pathBuffer)];
                    case 1:
                        responseBuffer = _a.sent();
                        offset = 1;
                        pubKeyLen = responseBuffer.subarray(0, offset)[0] - 1;
                        pubKeyBuffer = responseBuffer.subarray(++offset, (offset += pubKeyLen));
                        chainCodeLen = responseBuffer.subarray(offset, ++offset)[0];
                        chainCodeBuffer = responseBuffer.subarray(offset, offset + chainCodeLen);
                        address = "0x" + this.publicKeyToAddress(pubKeyBuffer).toString("hex");
                        return [2 /*return*/, {
                                publicKey: pubKeyBuffer,
                                chainCode: chainCodeBuffer,
                                address: address
                            }];
                }
            });
        });
    };
    /**
     * Sign an Aptos transaction.
     *
     * @param path a BIP32 path
     * @param txBuffer serialized transaction
     *
     * @returns an object with the signature field
     *
     * @example
     * Aptos.signTransaction("m/44'/637'/1'/0'/0'", txBuffer).then(r => r.signature)
     */
    Aptos.prototype.signTransaction = function (path, txBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var pathBuffer, responseBuffer, signatureLen, signatureBuffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pathBuffer = this.pathToBuffer(path);
                        return [4 /*yield*/, this.sendToDevice(INS.SIGN_TX, P1_START, P2_MORE, pathBuffer)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.sendToDevice(INS.SIGN_TX, 1, P2_LAST, txBuffer)];
                    case 2:
                        responseBuffer = _a.sent();
                        signatureLen = responseBuffer[0];
                        signatureBuffer = responseBuffer.subarray(1, 1 + signatureLen);
                        return [2 /*return*/, { signature: signatureBuffer }];
                }
            });
        });
    };
    // send chunked if payload size exceeds maximum for a call
    Aptos.prototype.sendToDevice = function (instruction, p1, p2, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var acceptStatusList, payloadOffset, buf_1, reply_1, buf, reply;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        acceptStatusList = [errors_1.StatusCodes.OK];
                        payloadOffset = 0;
                        if (!(payload.length > MAX_APDU_LEN)) return [3 /*break*/, 3];
                        _a.label = 1;
                    case 1:
                        if (!(payload.length - payloadOffset > MAX_APDU_LEN)) return [3 /*break*/, 3];
                        buf_1 = payload.subarray(payloadOffset, (payloadOffset += MAX_APDU_LEN));
                        return [4 /*yield*/, this.transport.send(LEDGER_CLA, instruction, p1++, P2_MORE, buf_1, acceptStatusList)];
                    case 2:
                        reply_1 = _a.sent();
                        this.throwOnFailure(reply_1);
                        return [3 /*break*/, 1];
                    case 3:
                        buf = payload.subarray(payloadOffset);
                        return [4 /*yield*/, this.transport.send(LEDGER_CLA, instruction, p1, p2, buf, acceptStatusList)];
                    case 4:
                        reply = _a.sent();
                        this.throwOnFailure(reply);
                        return [2 /*return*/, reply.subarray(0, reply.length - 2)];
                }
            });
        });
    };
    Aptos.prototype.pathToBuffer = function (originalPath) {
        var path = originalPath
            .split("/")
            .filter(function (value) { return value !== "m"; })
            .map(function (value) {
            return value.endsWith("'") || value.endsWith("h") ? value : value + "'";
        })
            .join("/");
        var pathNums = bip32_path_1["default"].fromString(path).toPathArray();
        return this.serializePath(pathNums);
    };
    Aptos.prototype.serializePath = function (path) {
        var e_1, _a;
        var buf = Buffer.alloc(1 + path.length * 4);
        buf.writeUInt8(path.length, 0);
        try {
            for (var _b = __values(path.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), i = _d[0], num = _d[1];
                buf.writeUInt32BE(num, 1 + i * 4);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return buf;
    };
    Aptos.prototype.publicKeyToAddress = function (pubKey) {
        var hash = sha3_1.sha3_256.create();
        hash.update(pubKey);
        hash.update("\x00");
        return Buffer.from(hash.digest());
    };
    Aptos.prototype.throwOnFailure = function (reply) {
        // transport makes sure reply has a valid length
        var status = reply.readUInt16BE(reply.length - 2);
        if (status !== errors_1.StatusCodes.OK) {
            throw new Error("Failure with status code: 0x".concat(status.toString(16)));
        }
    };
    return Aptos;
}());
exports["default"] = Aptos;
//# sourceMappingURL=Aptos.js.map