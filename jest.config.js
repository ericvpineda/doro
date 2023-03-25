module.exports = {
    // Add this line to your Jest config
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleNameMapper: {
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
      "\\.(scss|sass|css)$": "identity-obj-proxy"
    },
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: [
      '<rootDir>/node_modules/',
    ],
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest'],
    },
    // transformIgnorePatterns: ['/node_modules/', '<rootDir>/node_modules/util-deprecate'],
    coverageReporters: [
      "text",
      "lcov",
      "jest-badges"
    ]
  }