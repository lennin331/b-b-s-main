# BrokeBuddieSplitter
An app where your inexistent money is being split with your imaginary friends for Netflix.


A smart expense-splitting system for friend groups who suck at keeping track of who paid for what. No more awkward “you owe me bro” moments — this app calculates, simplifies, and settles debts like a financial therapist.

---

##  Features

-  Add shared/group expenses with custom splits
-  View real-time balances: who owes whom & how much
-  Minimal transactions: optimized settlements
-  Save/export results as CSV, PDF, or sharable links
-  Optional login support for multi-device access

---

##  Tech Stack

| Layer           | Tools                     |
|----------------|----------------------------|
| Core Logic      |          JavaScript        |
| Frontend (opt)  | React / Flask / CLI        |
| Backend (opt)   |     null                    |
| Extras          | Chart.js, jsPDF, Web Share |

---

##  Quick Demo (CLI Example)

```bash
> add "Josh paid ₹800 for pizza split 4 ways"
> add "Anand paid ₹1000 for Netflix shared with Josh and Sid"
> balance
Sid owes Josh ₹200  
Josh owes Anand ₹333  
