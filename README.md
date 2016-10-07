# s2v-iia-nodejs-webchat-pcs-demo
Extension to the webchat demo with an example of integrating with PCS (also has the speech2text extension as well).

This webchat demo is a specialised version of the s2v-iia-nodejs-webchat-demo. Refer to the other repository for the base version.

This extension replaces the SPHERO commands with commands to interact with Oracle Process Cloud Service. In addition, we have added the speech2text capability from the s2v-iia-speech2text-demo.

To run it:

1. Clone or download Zip file
2. Install the dependent modules: npm install
3. Configure a CORS server (try https://www.npmjs.com/package/cors-anywhere)
4. Open the file: public/js/chat.js and search for the following variables:

                var pcsUrl =
                var pcsAuth =
                var body =

        Update the values with the Oracle PCS Service URL (going through the CORS proxy), the Basic Authentication credentials and the template payload to initiate the PCS process.

4. Run the Web chat Node.JS server: node app.js
5. Open a browser and go to http://IP:3003
6. In the browser enter a nickname and email - Ideally use an account that has a Gravatar account, so that it can integrate with it and use your picture, rather than a grey faceless man.
7. Once you create a private room, it will give you a unique id, give it to a friend (make sure the IP address is accessible by your friend) and ask him to enter a nickname and email as well.
8. That's it, happy chatting!

If you want to send commands to the PCS, you can type the commands in free English (non case-sensitive), just make sure to follow these rules:

a) Having the word "incident" in the sentence will trigger a process instance
b) Having the word "work" in the sentence (in addition to the word "incident" will trigger a process instance that is "work related")
c) Having the word "hello" in the sentence, there application will reply back saying "Hi" (automated chatbot like functionality).

For example, the following sentences work in the same way:

     - Please open a work incident
     - incident work
     - I want to lodge an incident at work

Note: Since this webchat integrates with Gravatar and responsivevoice TTS, it requires access to Internet.

