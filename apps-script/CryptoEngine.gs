/**
 * GGSIPU Cryptographic Engine for Apps Script
 * Provides SHA-256 Hashing, Merkle Tree Root calculation, and Integrity verification.
 */

var CryptoEngine = {

  /**
   * Generates a deterministic SHA-256 cryptographic hash for a certificate record
   */
  generateCertificateHash: function(record) {
    var certId = record.CertID || "";
    var rollNo = record.RollNumber || record.RollNo || "";
    var name = record.StudentName || record.Name || "";
    var event = record.EventName || record.Event || "";
    var date = record.IssueDate || "";
    var salt = CONFIG.DEFAULT_SALT;

    // Standardized payload format for hash immutability
    var payload = [
      "CERT_ID:" + certId,
      "ROLL_NO:" + String(rollNo).trim(),
      "NAME:" + String(name).trim().toUpperCase(),
      "EVENT:" + String(event).trim(),
      "DATE:" + String(date).trim(),
      "SALT:" + salt
    ].join("|");

    return this.sha256Hex(payload);
  },

  /**
   * Calculates SHA-256 Hash using Utilities.computeDigest in Apps Script
   */
  sha256Hex: function(inputStr) {
    var rawDigest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, inputStr, Utilities.Charset.UTF_8);
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
    if (!hashes || hashes.length === 0) return "";
    if (hashes.length === 1) return hashes[0];

    var currentLayer = hashes.slice();

    while (currentLayer.length > 1) {
      var nextLayer = [];
      for (var i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          var combined = currentLayer[i] + currentLayer[i + 1];
          nextLayer.push(this.sha256Hex(combined));
        } else {
          // If odd number, duplicate last hash
          var combinedOdd = currentLayer[i] + currentLayer[i];
          nextLayer.push(this.sha256Hex(combinedOdd));
        }
      }
      currentLayer = nextLayer;
    }

    return currentLayer[0];
  }
};
