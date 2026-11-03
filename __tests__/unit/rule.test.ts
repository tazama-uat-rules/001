/* eslint-disable @typescript-eslint/no-unused-vars */
import { type DataCache, type RuleConfig, type RuleRequest, type RuleResult } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import {
  DatabaseManagerMock,
  determineOutcome,
  LoggerServiceMock,
  MockDatabaseManagerFactory,
  MockLoggerServiceFactory,
} from '@tazama-lf/frms-coe-lib/lib/tests/mocks';
import { handleTransaction, RuleExecutorConfig } from '../../src/rule';

const getRuleConfig = (): RuleConfig => {
  return {
    id: '001@4.0.0',
    cfg: '4.0.0',
    desc: 'Derived account age - creditor',
    config: {
      bands: [
        {
          reason: 'Creditor account is less than 1 day old',
          subRuleRef: '.01',
          upperLimit: 86400000,
        },
        {
          reason: 'Creditor account is between 1 and 30 days old',
          lowerLimit: 86400000,
          subRuleRef: '.02',
          upperLimit: 2592000000,
        },
        {
          reason: 'Creditor account is between 30 and 90 days old',
          lowerLimit: 2592000000,
          subRuleRef: '.03',
          upperLimit: 7776000000,
        },
        {
          reason: 'Creditor account is more than 90 days old',
          lowerLimit: 7776000000,
          subRuleRef: '.04',
        },
      ],
      parameters: {},
      exitConditions: [
        {
          reason: 'No verifiable creditor account activity detected',
          subRuleRef: '.x01',
        },
      ],
    },
    creDtTm: '2026-09-13T09:37:04.113Z',
    updDtTm: '2026-09-13T09:37:04.113Z',
    tenantId: 'DEFAULT',
  };
};

const getMockRequest = (): RuleRequest => {
  const quote = {
    transaction: JSON.parse(
      `{"TxTp":"pacs.008.001.10","Payload":{"FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"0f070a0660ea4a7cb78f4bc2a5cdffe6","CreDtTm":"2026-08-28T09:08:33.646Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"RmtInf":{"Ustrd":"04d502d2-9594-4503-8e54-9b502789f9cb"},"RgltryRptg":{"Dtls":{"Cd":"100","Tp":"BALANCE OF PAYMENTS"}},"CdtTrfTxInf":{"Cdtr":{"Id":{"PrvtId":{"Othr":{"0":{"Id":"cdtr_9ee13ffb5b6842ad884f6f52ebfe6610","SchmeNm":{"Prtry":"TAZAMA_EID"}}},"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"}}},"Nm":"Felicia Easton Quill","CtctDtls":{"MobNb":"+27-707650428"}},"Dbtr":{"Id":{"PrvtId":{"Othr":{"0":{"Id":"dbtr_63e2c14f2fed465fa219f99d75576426","SchmeNm":{"Prtry":"TAZAMA_EID"}}},"DtAndPlcOfBirth":{"BirthDt":"2001-08-09","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"}}},"Nm":"April Blake Grant","CtctDtls":{"MobNb":"+27-730975224"}},"Purp":{"Cd":"MP2P"},"PmtId":{"InstrId":"5ab4fc7355de4ef8a75b78b00a681ed2","EndToEndId":"f2e2d04896fc48ecb750e7041061c0af"},"ChrgBr":"DEBT","CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"fsp002"}}},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"fsp001"}}},"CdtrAcct":{"Id":{"Othr":{"0":{"Id":"cdtrAcct_775057097af3433d8801653c51c6b791","SchmeNm":{"Prtry":"MSISDN"}}}},"Nm":"Felicia Quill"},"ChrgsInf":{"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"fsp001"}}},"Amt":{"Amt":0,"Ccy":"XTS"}},"DbtrAcct":{"Id":{"Othr":{"0":{"Id":"dbtrAcct_d7ddc693635e4997a84540094530a1e0","SchmeNm":{"Prtry":"MSISDN"}}}},"Nm":"April Grant"},"InitgPty":{"Id":{"PrvtId":{"Othr":{"0":{"Id":"+27730975224","SchmeNm":{"Prtry":"MSISDN"}}},"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"}}},"Nm":"April Blake Grant","CtctDtls":{"MobNb":"+27-730975224"}},"InstdAmt":{"Amt":{"Amt":49.78,"Ccy":"XTS"}},"XchgRate":"1","IntrBkSttlmAmt":{"Amt":{"Amt":49.78,"Ccy":"XTS"}}},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2021-11-30T10:38:56.000Z","InitgPty":{"Glctn":{"Lat":"-3.1609","Long":"38.3588"}}}}}}},"TenantId":"TAZAMA"}`,
    ),
    networkMap: JSON.parse(
      '{}',
    ),
    DataCache: JSON.parse(
      '{"cdtrId":"cdtr_9ee13ffb5b6842ad884f6f52ebfe6610TAZAMA_EID","dbtrId":"dbtr_63e2c14f2fed465fa219f99d75576426TAZAMA_EID","creDtTm":"2026-08-28T09:08:33.646Z","instdAmt":{"amt":"49.78","ccy":"XTS"},"xchgRate":"1","cdtrAcctId":"cdtrAcct_775057097af3433d8801653c51c6b791MSISDNfsp002","dbtrAcctId":"dbtrAcct_d7ddc693635e4997a84540094530a1e0MSISDNfsp001","intrBkSttlmAmt":{"amt":"49.78","ccy":"XTS"}}',
    ),
  };
  return quote;
};

const getMockRequestUnsuccessful = (): RuleRequest => {
  const quote = getMockRequest();
  quote.transaction.FIToFIPmtSts.TxInfAndSts.TxSts = 'RJCT';
  return quote;
};

const ruleResult: RuleResult = {
  id: '021@1.0.0',
  cfg: '1.0.0',
  tenantId: 'TAZAMA',
  subRuleRef: '.err',
  reason: 'Unhandled rule result outcome',
};


const dataCache: DataCache = {
  dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',
  cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',
  dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',
  cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',
};

let databaseManager: DatabaseManagerMock<RuleExecutorConfig>;

let loggerService: LoggerServiceMock;
describe('Rule 021 Test', () => {
beforeEach(() => {
        loggerService = MockLoggerServiceFactory();
        loggerService.resetMock();
        databaseManager = MockDatabaseManagerFactory<RuleExecutorConfig>();
        databaseManager.resetMock();
  });
  describe('handleTransaction', () => {
    describe('Rule-021 bands Testing', () => {
let dataCache: DataCache;
        let req: RuleRequest;
        const amounts = [1000.0, 899.99, 900.0, 900.01, 1099.99, 1100.0, 1100.01];
beforeEach(() => {
        dataCache = {
            dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',
            cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',
            dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',
            cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',
        };
        req = getMockRequest();
      });
test(".01 result with reason of 'The creditor has received an insignificant number of transactions with the same amount in the last 24 hour", async () => {
        const dbData = [2000, 1000, 3000];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const res = await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0", "tenantId": "TAZAMA","cfg":"1.0.0","subRuleRef":".01","reason":"The creditor has received an insignificant number of transactions with the same amount in the last 24 hours"}',
          ),
        );
      });
test(".02 result with reason of 'The creditor has received a significant number of transactions with the same amount in the last 24 hours'", async () => {
        const dbData = [2000, 2022, 50000];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const res = await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0","tenantId": "TAZAMA", "cfg":"1.0.0","subRuleRef":".02","reason":"The creditor has received a significant number of transactions with the same amount in the last 24 hours"}',
          ),
        );
      });
test('.02 result omitted maxQueryRange parameter', async () => {
        const dbData = [2000, 2022, 50000];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const rConfig = getRuleConfig();
        rConfig.config.parameters!.maxQueryRange = undefined;
        const res = await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0", "tenantId": "TAZAMA","cfg":"1.0.0","subRuleRef":".02","reason":"The creditor has received a significant number of transactions with the same amount in the last 24 hours"}',
          ),
        );
      });
    });
    describe('Exit Conditions', () => {
let dataCache: DataCache;
        let req: RuleRequest;
beforeEach(() => {
        dataCache = {
            dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',
            cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',
            dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',
            cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',
        };
        req = getMockRequest();
      });
test(".x00 Rule return -> 'Unsuccessful transaction'", async () => {
        databaseManager._eventHistory.query.mockResolvedValue({ rows: [] });
        const req = getMockRequestUnsuccessful();
        const res = await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        expect(res).toEqual(
          JSON.parse('{"id":"021@1.0.0", "cfg":"1.0.0","subRuleRef":".x00","reason":"Unsuccessful transaction", "tenantId": "TAZAMA"}'),
        );
      });
test(".x01 Rule return -> 'Insufficient transaction history'", async () => {
        const dbData = [1];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const res = await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0","tenantId": "TAZAMA", "cfg":"1.0.0","subRuleRef":".x01","reason":"Insufficient transaction history"}',
          ),
        );
      });
test('No RuleConfig - bands', async () => {
        const dbData = [1];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const rConfig = getRuleConfig();
        rConfig.config.bands = undefined;
        try {
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - bands not provided');
        }
      });
test('array isnt numbers', async () => {
        const dbData = ['baz', 'bar', 'foo'];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Data error: query result type mismatch - expected [numbers]');
        }
      });
test("error return -> 'Empty result from query response'", async () => {
        databaseManager._eventHistory.query.mockResolvedValue({ rows: [] });
        try {
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Data error: irretrievable transaction history');
        }
      });
test('No exit conditions', async () => {
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.exitConditions = undefined;
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - exitConditions not provided');
        }
      });
test('No exit conditions - bad or missing subRuleRef for ".x00"', async () => {
        databaseManager._eventHistory.query.mockResolvedValue({ rows: [] });
        try {
          const rConfig = getRuleConfig();
          const newReq = getMockRequest();
          newReq.transaction.FIToFIPmtSts.TxInfAndSts.TxSts = '.x00';
          rConfig.config.exitConditions![0].subRuleRef = '';
          rConfig.config.parameters!.maxQueryLimit = 2;
          rConfig.config.parameters!.tolerance = 0.1;
          const res = await handleTransaction(newReq, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
          expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0", "tenantId": "TAZAMA","cfg":"1.0.0","desc":"No description provided in rule config.","subRuleRef":".x00","reason":"Incoming transaction is unsuccessful"}',
          ),
        );
        } catch (error) {
          expect((error as Error).message).toBe('Unsuccessful transaction and no exit condition in config');
        }
      });
test('No exit conditions - bad or missing subRuleRef for ".x01"', async () => {
        const dbData = [50];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          const newReq = getMockRequest();
          rConfig.config.exitConditions![1].subRuleRef = '';
          const res = await handleTransaction(newReq, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
          expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0","tenantId": "TAZAMA", "cfg":"1.0.0","desc":"No description provided in rule config.","subRuleRef":".x00","reason":"Incoming transaction is unsuccessful"}',
          ),
        );
        } catch (error) {
          expect((error as Error).message).toBe('Insufficient History and no exit condition in config');
        }
      });
test('No tolerance', async () => {
        // Mocking the request of getting oldes transation timestamp
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.parameters!.tolerance = undefined;
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - tolerance parameter not provided or invalid type');
        }
      });
test('No tolerance - not number', async () => {
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.parameters!.tolerance = 'zero point two';
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - tolerance parameter not provided or invalid type');
        }
      });
    });
  });
});