import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";

actor {
  type ContactFormSubmission = {
    name : Text;
    email : Text;
    message : Text;
    timestamp : Time.Time;
  };

  let contactSubmissions = Map.empty<Text, ContactFormSubmission>();
  var visitorCount = 0;

  public shared ({ caller }) func submitContactForm(name : Text, email : Text, message : Text) : async () {
    let timestamp = Time.now();
    let submission : ContactFormSubmission = { name; email; message; timestamp };
    contactSubmissions.add(timestamp.toText(), submission);
  };

  public query ({ caller }) func getAllContactSubmissions() : async [ContactFormSubmission] {
    contactSubmissions.values().toArray();
  };

  public shared ({ caller }) func incrementVisitorCount() : async Nat {
    visitorCount += 1;
    visitorCount;
  };

  public query ({ caller }) func getVisitorCount() : async Nat {
    visitorCount;
  };
};
