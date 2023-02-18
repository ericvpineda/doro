import pkceChallenge from "pkce-challenge";

const generateChallenge = (): [string, string] => {
  const {code_verifier, code_challenge} = pkceChallenge(64);
  return [code_challenge, code_verifier];
};

export default generateChallenge;
