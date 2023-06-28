
export const config = {
    api: {
        bodyParser: false,
    },
};
var getRawBody = require('raw-body')
const Stripe = require('stripe');
 import Cors from 'micro-cors';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15'
});
const cors = Cors({
    allowMethods: ['POST','GET', 'HEAD'],
  });
// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;
const webhookSecret = 'whsec_OdU0XDvA1Xp00LltoMDuzvSevIjNGWbM';
//this is for testing the NGOK local tunnel. without having to deploy.



const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const serviceAccount = require('../../serviceAccountKey.json');

initializeApp({
    credential: cert(serviceAccount)
  });

const db = getFirestore();




const handler = async (req, res) => {

    if (req.method === "POST") {
        const buf = await getRawBody(req);
        const sig = req.headers["stripe-signature"]!;
        let stripeEvent;
        let customer;

        try {
            stripeEvent = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
            console.log( 'stripeEvent', stripeEvent );
        } catch (err) {
            res.status(400).send(`Webhook Errorsssssss: ${err.message}`);
            return;
        }

        if ( 'checkout.session.completed' === stripeEvent.type ) {
            const session = stripeEvent.data.object;
            console.log( 'CUSTUMER ID ON MY SERVER WEBHOOOK => ', session.customer );
            console.log( 'SUBSCRIPTION ID ON MY SERVER WEBHOOOK => ', session.subscription );
            console.log( 'CLIENT_REFERENCE_ID ON MY SERVER WEBHOOOK => ', session.client_reference_id );
            console.log( '✅ "payment_status":"paid", ON MY SERVER WEBHOOOK => ', session.metadata.orderId, session.id );
            // Payment Success.
            if(session.payment_status === 'paid') {
                    // Fulfill any orders, e-mail receipts, etc
                    // To cancel the order, you will need to issue a Refund (https://stripe.com/docs/api/refunds)
                    try{
                        const createUserInFirestore = async(clientrefid) => {
                                    console.log('creatingUserInFirestore for the following user => ', clientrefid);
                                    // Add a new document in collection "cities" with ID 'LA'
                                    const data = {
                                        StripeCustomerID: session.customer,
                                        StripeSubscriptionID: session.subscription,
                                        StripeActiveSubscription: true,
                                    };

                                    const res = await db.collection('USERS').doc(clientrefid).set(data);
                        };
                        createUserInFirestore(session.client_reference_id);
                        
                    }
                    
                    catch(err){
                        console.log(err)
                    }
              
                };
  
  

             res.json({ received: true, user: customer });

    }
    else if('customer.subscription.deleted' === stripeEvent.type) {
        const session = stripeEvent.data.object;
       
        // We have access to the subscription ID and the customer ID.
        //we can grab the stores in firestore that have the customer equal to the customer in stripe.
        //each store also has an active or not active field.
        //the user also has an active field and we have to change that.
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("Method Not Allowedeheheheheheheheheheheh");
    }
}
};


// export default handler;
export default cors(handler);
