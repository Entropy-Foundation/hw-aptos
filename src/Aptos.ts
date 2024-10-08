import BIPPath from "bip32-path";
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import Transport from "@ledgerhq/hw-transport";
import { StatusCodes } from "@ledgerhq/errors";

const MAX_APDU_LEN = 255;
const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;
const P1_START = 0x00;
const P2_MORE = 0x80;
const P2_LAST = 0x00;

const LEDGER_CLA = 0x5b;
const INS = {
  GET_VERSION: 0x03,
  GET_PUBLIC_KEY: 0x05,
  SIGN_TX: 0x06,
};

interface AppConfig {
  version: string;
}

interface AddressData {
  publicKey: Buffer;
  chainCode: Buffer;
  address: string;
}

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
export default class Aptos {
  readonly transport: Transport;

  constructor(
    transport: Transport,
    // the type annotation is needed for doc generator
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    scrambleKey: string = "Aptos"
  ) {
    this.transport = transport;
    this.transport.decorateAppAPIMethods(
      this,
      ["getVersion", "getAddress"],
      scrambleKey
    );
  }

  /**
   * Get application version.
   *
   * @returns an object with the version field
   *
   * @example
   * Aptos.getVersion().then(r => r.version)
   */
  async getVersion(): Promise<AppConfig> {
    const [major, minor, patch] = await this.sendToDevice(
      INS.GET_VERSION,
      P1_NON_CONFIRM,
      P2_LAST,
      Buffer.alloc(0)
    );
    return {
      version: `${major}.${minor}.${patch}`,
    };
  }
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
  async getAddress(
    path: string,
    // the type annotation is needed for doc generator
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    display: boolean = false
  ): Promise<AddressData> {
    const pathBuffer = this.pathToBuffer(path);
    const responseBuffer = await this.sendToDevice(
      INS.GET_PUBLIC_KEY,
      display ? P1_CONFIRM : P1_NON_CONFIRM,
      P2_LAST,
      pathBuffer
    );

    let offset = 1;
    const pubKeyLen = responseBuffer.subarray(0, offset)[0] - 1;
    const pubKeyBuffer = responseBuffer.subarray(
      ++offset,
      (offset += pubKeyLen)
    );
    const chainCodeLen = responseBuffer.subarray(offset, ++offset)[0];
    const chainCodeBuffer = responseBuffer.subarray(
      offset,
      offset + chainCodeLen
    );

    const address =
      "0x" + this.publicKeyToAddress(pubKeyBuffer).toString("hex");

    return {
      publicKey: pubKeyBuffer,
      chainCode: chainCodeBuffer,
      address,
    };
  }

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
  async signTransaction(
    path: string,
    txBuffer: Buffer
  ): Promise<{ signature: Buffer }> {
    const pathBuffer = this.pathToBuffer(path);
    await this.sendToDevice(INS.SIGN_TX, P1_START, P2_MORE, pathBuffer);
    const responseBuffer = await this.sendToDevice(
      INS.SIGN_TX,
      1,
      P2_LAST,
      txBuffer
    );

    const signatureLen = responseBuffer[0];
    const signatureBuffer = responseBuffer.subarray(1, 1 + signatureLen);
    return { signature: signatureBuffer };
  }

  // send chunked if payload size exceeds maximum for a call
  private async sendToDevice(
    instruction: number,
    p1: number,
    p2: number,
    payload: Buffer
  ): Promise<Buffer> {
    const acceptStatusList = [StatusCodes.OK];
    let payloadOffset = 0;

    if (payload.length > MAX_APDU_LEN) {
      while (payload.length - payloadOffset > MAX_APDU_LEN) {
        const buf = payload.subarray(
          payloadOffset,
          (payloadOffset += MAX_APDU_LEN)
        );
        const reply = await this.transport.send(
          LEDGER_CLA,
          instruction,
          p1++,
          P2_MORE,
          buf,
          acceptStatusList
        );
        this.throwOnFailure(reply);
      }
    }

    const buf = payload.subarray(payloadOffset);
    const reply = await this.transport.send(
      LEDGER_CLA,
      instruction,
      p1,
      p2,
      buf,
      acceptStatusList
    );
    this.throwOnFailure(reply);

    return reply.subarray(0, reply.length - 2);
  }

  private pathToBuffer(originalPath: string): Buffer {
    const path = originalPath
      .split("/")
      .filter((value) => value !== "m")
      .map((value) =>
        value.endsWith("'") || value.endsWith("h") ? value : value + "'"
      )
      .join("/");
    const pathNums: number[] = BIPPath.fromString(path).toPathArray();
    return this.serializePath(pathNums);
  }

  private serializePath(path: number[]): Buffer {
    const buf = Buffer.alloc(1 + path.length * 4);
    buf.writeUInt8(path.length, 0);
    for (const [i, num] of path.entries()) {
      buf.writeUInt32BE(num, 1 + i * 4);
    }
    return buf;
  }

  private publicKeyToAddress(pubKey: Buffer): Buffer {
    const hash = sha3Hash.create();
    hash.update(pubKey);
    hash.update("\x00");
    return Buffer.from(hash.digest());
  }

  private throwOnFailure(reply: Buffer): void {
    // transport makes sure reply has a valid length
    const status = reply.readUInt16BE(reply.length - 2);
    if (status !== StatusCodes.OK) {
      throw new Error(`Failure with status code: 0x${status.toString(16)}`);
    }
  }
}
