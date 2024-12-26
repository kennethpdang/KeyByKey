# KeyByKey
Every year students learn something for a class or a lecture at a university and/or institution and then simply forget about it. This is my firsthand experience. I graduated from Clear Horizons Early College Highschool with over 77+ credit hours and taking advanced mathematical courses like differential equations, multivariable calculus, and also linear algebra. However, I have retained none of the information that I had study since high school and three years later when I was ready to take a course in partial differential equations, I was under immense stress forgetting how to do basic ODEs.

The Bible is clear that to have in 1 Peter 3:15 we are called to: "always being prepared to make a defense to anyone who asks you for a reason for the hope that is in you; yet do it with gentleness and respect". When Jesus was tempted in the wilderness, He had qouted scripture. It is mentioned in Psalms 119, "How can a young man keep his way pure? By guarding it according to your word [...] I have stored up your word in my heart, that I might not sin against you". In Ephesians 6:17, we are called to pick up the "sword of the Spirit which is the word of God". Scripture memory allows us to meditate on God's word and also to better combat sin and see God. This is why, God commanded the Israelites way back then (before the completion of the Bible) to "this book of the law shall not depart your mouth, but you shall meditate on it day and night so that you may be careful to do according to all that is written in it". Obviously, it would be a very appropriate pushback that Joshua 1:8 is not referring to the Bible we currently have. However, I would rebuttal that even from then, you can see God's heart for memorizing His law. The prophet Jeremiah said: "your words were found and I ate them, and your words became to me a joy and the delight of my heart for I am called by your name, O' Lord, God of Hosts".

In fact, love of scripture has been throughout the early church fathers and faithful servants of Christ. When Martin Luther was alone in the Augustinian monastery, he had found a love for scripture being encouraged by Johann Staupitz. In Dietrich Bonhoeffer's journal, when he was imprisoned in a prison cell, Bonhoeffer is comforted with words from scripture. He writes his heart out about purpose and about time in *Letters and Papers from Prison*. He even wrote a sermon for a wedding for his friend Eberhard Bethge while imprisoned (thus he couldn't attend the wedding himself). He reflects on what the meaning and institution of marriage is qouting vereses like Ephesians 1:12, Colossions 3, Psalms 127:3 and several others from memory. When the reformed pastor Richard Wurmbrand was imprisoned under communist rule, he would comfort himself by pretending he would preach a sermon on a verse that he knew from heart. Then he would remember those sermons. By the grace of God, when he was released, he wrote the book *Sermons in Solitary Confinement*.

However, aside from just scriptural memorization, it is beneficial to memorize apologetics things. We have: "Beloved, although I was very eager to write to you about our common salvation, I found it necessary to write appealing to you to contend for the faith that was once for all delivered to the saints." - Jude 1:3

"To the Jews I became like a Jew, to win the Jews; to those under the law I became like one under the law (though I myself am not under the law), so as to win those under the law. ... I have become all things to all people so that by all possible means I might save some." - 1 Corinthians 9:20-22

Paul then stood up in the meeting of the Areopagus and said: 'People of Athens! I see that in every way you are very religious. For as I walked around and looked carefully at your objects of worship, I even found an altar with this inscription: to an unknown god. So you are ignorant of the very thing you worship—and this is what I am going to proclaim to you. - Acts 22

This application is suppose to help with that and also with apologetics and any other memorizational things, not even limited to an apparent growing in religious activities.

So what is the solution to this if we keep forgetting everything we learn in a theology class or in school? The solution is called *spaced repitition*. This terminology was introduced by. The way it works is that you start memorizing something very intensively initially but then space it out over time as you keep practicing it. This is what this software is designed to do.

## MERN Stack Application:
This is a very common project known as a MERN application. MERN is an acryonym for a tech stack. We have that the components that make up a MERN application are:
1. A Mongo Database
2. An Express.js Framework For Middleware
3. A React.js Frontend
4. A Node.js Backend

We separate this project into predominately two categories the frontend and the backend.

#### How Does This Application Work?

## Security Stuff:
What is the `.env` file? The `.env` file is where all the important and sensitive information belong. For example, when we create a MongoDB database, our application would need the database connection string, which has our password in the string. We do not want to expose this on repos like our Github, thus we have to hide it. We thus place that connection string in our `.env` file (which is globally accessible in a Node.js project) and then add the `.env` file to our `.gitignore` file. Anything in the `.gitignore` file does not get pushed to Github.