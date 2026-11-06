# Event RSVP (AWS)

A serverless event RSVP web app. Visitors browse upcoming tech events around Johannesburg, open an event, and RSVP **Yes** or **No**. Live Yes/No counts and a Going / Not Going list update after each RSVP.

Built as a cloud elective project while following an AWS full-stack tutorial, using a static frontend, API Gateway, Lambda, RDS (MySQL) and DynamoDB.

## Features

- Event cards loaded from a MySQL database, sorted by start date
- Event detail modal with banner, venue, date and time
- RSVP form (name, email, Yes/No)
- Duplicate protection: one RSVP per email per event
- Live Yes/No counters and attendee names
- Responsive layout, click outside the modal to close it

## Architecture

```
Browser (HTML/CSS/JS)
        |  fetch()
        v
API Gateway (HTTP API)
        |  Lambda proxy integration
        v
Lambda: event-rsvp-handler (Node.js)
        |                          |
        v                          v
RDS MySQL                      DynamoDB
event details                  RSVPs + Yes/No counters
(table: events)                (table: event-rsvp-responses)
```

**Why two databases?** Event details are relational and rarely change, so they live in MySQL. RSVPs are write-heavy and need atomic counters, which DynamoDB handles well.

## API

All routes are served by one Lambda function.

| Method | Route                  | Description                                              | Source   |
| ------ | ---------------------- | -------------------------------------------------------- | -------- |
| GET    | `/events`              | List all events, ordered by `start_at`                   | MySQL    |
| GET    | `/event/{event_id}`    | Single event's details (404 if not found)                | MySQL    |
| GET    | `/stats/{event_id}`    | `{ "Yes": n, "No": n }` counters                         | DynamoDB |
| GET    | `/attendees/{event_id}`| Respondents; optional `?response=Yes` or `?response=No`  | DynamoDB |
| POST   | `/rsvp`                | Record an RSVP                                           | DynamoDB |
| OPTIONS| any                    | CORS preflight                                           | n/a      |

**POST `/rsvp` body**

```json
{
  "event_id": "1",
  "full_name": "Ada Lovelace",
  "email": "ada@example.com",
  "response": "Yes"
}
```

Responses: `200` recorded, `400` missing fields, `409` duplicate RSVP (`code: "DUPLICATE_RSVP"`), `500` server error.

### DynamoDB data model

Table `event-rsvp-responses`, partition key `pk` (String), sort key `sk` (String).

| pk            | sk                    | Attributes                                    |
| ------------- | --------------------- | --------------------------------------------- |
| `EVENT#<id>`  | `RESPONDENT#<email>`  | `full_name`, `email`, `response`, `timestamp` |
| `EVENT#<id>`  | `RESPONSE#Yes`        | `count`                                       |
| `EVENT#<id>`  | `RESPONSE#No`         | `count`                                       |

An RSVP is written with a **transaction**: it inserts the respondent item only if that email hasn't RSVP'd (`attribute_not_exists`), and increments the matching counter in the same operation. If the insert is rejected, the counter is not touched.

## Project structure

```
event-rsvp-aws/
├── index.html      # Page shell: header, events grid, modal container
├── style.css       # Styling
├── util.js         # API_BASE_URL, apiCall(), date/time helpers, modal close
├── events.js       # API wrappers, event cards, modal, RSVP submit
├── app.js          # Entry point: loads events on page load
├── index.js        # Lambda handler (routing, MySQL, DynamoDB)
├── package.json    # Backend dependency: mysql2 (ES modules enabled)
└── README.md
```

## Getting started

Full AWS setup (RDS, DynamoDB, Lambda, API Gateway, hosting) is in **[GUIDE.md](GUIDE.md)**. The short version:

1. Create the RDS MySQL database and the `events` table
2. Create the DynamoDB table `event-rsvp-responses` (`pk` / `sk`, both String)
3. Deploy `index.js` + `node_modules` to Lambda and set the environment variables below
4. Create an API Gateway HTTP API with the routes above
5. Set `API_BASE_URL` in `util.js` to your API Gateway URL
6. Open `index.html` (or host the frontend files on S3)

### Lambda environment variables

| Variable   | Meaning                          |
| ---------- | -------------------------------- |
| `REGION`   | AWS region, e.g. `us-east-1`     |
| `DB_HOST`  | RDS endpoint                     |
| `DB_USER`  | MySQL username                   |
| `DB_PASS`  | MySQL password                   |
| `DB_NAME`  | Database name                    |

Never commit real credentials. Keep them in Lambda's environment configuration only.

### Run the frontend locally

From the project folder, serve the static files with either option:

```bash
# Option 1: Node
npx serve .

# Option 2: Docker (nginx)
docker run --rm -p 8080:80 -v "$PWD":/usr/share/nginx/html:ro nginx:alpine
```

Then open the printed URL (for Docker: http://localhost:8080). The frontend still calls your deployed API, so the backend must be live.

## Known limitations and next steps

- **HTML escaping:** event fields and attendee names are inserted with `innerHTML` without escaping, so a malicious name could inject markup. Fix by escaping values or using `textContent`.
- **Email exposure:** `/attendees/{event_id}` returns every respondent's email to anyone. The UI only shows names, but the API should drop `email` from public responses.
- **Input validation:** `response` is not checked against `Yes` / `No` on the backend; any string would create a new counter item.
- **CORS:** currently `Access-Control-Allow-Origin: *`. Restrict to your frontend's domain for production.
- **Database connection:** the Lambda opens a MySQL connection on every request, including routes that only use DynamoDB. Move the connection into the routes that need it.
- **Repo hygiene:** add a `.gitignore` (at least `node_modules/` and `*.zip`).
- **Ideas:** create-event form, RSVP editing/cancel, email confirmation (SES), admin view, CloudFront + HTTPS for the frontend.

## Tech stack

HTML, CSS, vanilla JavaScript · Node.js (ES modules) · AWS Lambda · Amazon API Gateway · Amazon RDS (MySQL) · Amazon DynamoDB · `mysql2` · AWS SDK for JavaScript v3

## Author

[Brayyy-glitch](https://github.com/Brayyy-glitch)

WTC-FYTS69L5
