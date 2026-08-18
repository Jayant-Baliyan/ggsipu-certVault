/**
 * GGSIPU Cryptographic Engine for Apps Script
 * Provides SHA-256 Hashing, Merkle Tree Root calculation, and Integrity verification.
 */

var CryptoEngine = {

  /**
   * Generates a deterministic SHA-256 cryptographic hash for a certificate record
   */
  generateCertificateHash: function(record) {
    if (!record) return "";
    var certId = String(record.CertID || "").trim();
    var rollNo = String(record.RollNumber || record.RollNo || "").trim();
    var name = String(record.StudentName || record.Name || "").trim().toUpperCase();
    var event = String(record.EventName || record.Event || "").trim();
    var date = String(record.IssueDate || "").trim();
    var salt = (typeof CONFIG !== "undefined" && CONFIG.DEFAULT_SALT) ? CONFIG.DEFAULT_SALT : "GGSIPU_SALT_2026_DSW_SECURE_HASH";

    // Standardized canonical payload format for deterministic hash immutability
    var payload = [
      "CERT_ID:" + certId,
      "ROLL_NO:" + rollNo,
      "NAME:" + name,
      "EVENT:" + event,
      "DATE:" + date,
      "SALT:" + salt
    ].join("|");

    return this.sha256Hex(payload);
  },

  /**
   * Calculates SHA-256 Hash using Utilities.computeDigest in Apps Script
   */
  sha256Hex: function(inputStr) {
    if (!inputStr) return "";
    var rawDigest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(inputStr), Utilities.Charset.UTF_8);
    var txt = "";
    for (var i = 0; i < rawDigest.length; i++) {
      var byteValue = rawDigest[i];
      if (byteValue < 0) byteValue += 256;
      var byteHex = byteValue.toString(16);
      if (byteHex.length === 1) byteHex = "0" + byteHex;
      txt += byteHex;
    }
    return txt;
  },

  /**
   * Calculates Merkle Tree Root from an array of SHA-256 hashes
   */
  calculateMerkleRoot: function(hashes) {
    if (!hashes || !Array.isArray(hashes) || hashes.length === 0) return "";
    if (hashes.length === 1) return hashes[0];

    var currentLayer = hashes.slice();

    while (currentLayer.length > 1) {
      var nextLayer = [];
      for (var i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          var combined = currentLayer[i] + currentLayer[i + 1];
          nextLayer.push(this.sha256Hex(combined));
        } else {
          // If odd number of leaves, duplicate last hash
          var combinedOdd = currentLayer[i] + currentLayer[i];
          nextLayer.push(this.sha256Hex(combinedOdd));
        }
      }
      currentLayer = nextLayer;
    }

    return currentLayer[0];
  }
};
