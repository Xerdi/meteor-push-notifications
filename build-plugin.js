import {VAPIDCredentials} from "./credentials";

const credentials = VAPIDCredentials.auto();
if (credentials.isNewlyCreated) {
    credentials.save();
}
