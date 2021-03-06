require("dotenv").config();
const helper = require("../helper/helper");
const basePath = process.env.BASE_PATH;
const docusign = require("docusign-esign");
const accountId = process.env.ACCOUNT_ID

const createRequest = async (request, accessToken) => {
  const validateRequest = await helper.validateRequest(request);
  if (validateRequest.status != 200) return validateRequest;

  const envelopeArgs = await helper.requestObject(request);

  const document = await helper.getDocument();

  const signer = await helper.createSigner(envelopeArgs);

  const signerWtabs = await helper.createTabs(signer);

  const recipient = await helper.createRecipient(signerWtabs);

  const eventNotification = await helper.createEventNotification()

  const envelope = await helper.createEnvelope(
    envelopeArgs,
    document,
    recipient,
    eventNotification
  );

  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(basePath);
  dsApiClient.addDefaultHeader(
    "Authorization",
    "Bearer " + accessToken
  );

  let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
    results = null;
try {

  // creates envelope
  results = await envelopesApi.createEnvelope(accountId, {
    envelopeDefinition: envelope,
  });
  let envelopeId = results.envelopeId;

  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);

    // embedded singing
    let viewRequest = helper.createRecipientViewRequest(envelopeArgs);
    
    results = await envelopesApi.createRecipientView(accountId, envelopeId,
        {recipientViewRequest: viewRequest});
    console.log("Embedded signing created.")

    return ({envelopeId: envelopeId, redirectUrl: results.url})
}
 catch (error) {
  console.log(error)
  }
}

module.exports = {
  createRequest
};
