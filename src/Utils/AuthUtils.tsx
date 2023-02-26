import pkceChallenge from "pkce-challenge";
const randomString  = require("randomstring")

const generateChallenge = (): [string, string] => {
  const {code_verifier, code_challenge} = pkceChallenge(64);
  return [code_challenge, code_verifier];
};

const random = (length: number): string => {
  return randomString.generate(length);
}

export {generateChallenge, random};
