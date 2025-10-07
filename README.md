# BrinX 
BrinX is built for students, by students { QuartZ }. We understand the challenges of college life — tight schedules, back-to-back classes, and limited time to run errands. Our platform connects students who need help with those who can help, creating a supportive campus community.

First, make a account at mongoDB (cloud).
Make a cluster.
Then it provide a link which contain your mongodb cloud username or registerd email and password.
Make .env file below package.json 
Add this code:---                                                                           

PORT=5000 <br>
MONGODB_URI=Add provided link here by mongodb cloud<br>
JWT_SECRET=your_super_secret_jwt_key_here =>> generate this from https://jwtsecrets.com/<br>
NODE_ENV=development<br>
EMAIL_SERVICE=ethereal<br>

save it.

now,
open the parent folder in terminal ( ex: BrinX-main )
and type

npm install

it will install all packages that are used in backend and frontend.

To run the project:

hit

npm run dev

now ctrl + click the given link in terminal. Or just copy and paste this link to browser  "" http://localhost:5000 ""
