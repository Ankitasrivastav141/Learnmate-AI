const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data for clean seed...');
  await prisma.quizAnswer.deleteMany();
  await prisma.quizSession.deleteMany();
  await prisma.question.deleteMany();
  await prisma.flashcard.deleteMany();
  await prisma.note.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.document.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.subject.deleteMany();

  console.log('Seeding initial subjects...');
  const csSubject = await prisma.subject.create({
    data: {
      name: 'Computer Systems & Architecture',
      description: 'Core concepts of operating systems, process scheduling, concurrency, and virtual memory.',
      color: '#3b82f6',
      icon: 'BookOpen',
    },
  });

  const mlSubject = await prisma.subject.create({
    data: {
      name: 'Machine Learning Foundations',
      description: 'Supervised and unsupervised learning, optimization algorithms, and gradient descent.',
      color: '#8b5cf6',
      icon: 'BrainCircuit',
    },
  });

  console.log('Seeding initial document and AI study pack...');
  const sampleDocText = `
Lecture 4: Operating System Process Scheduling & Concurrency

1. CPU Scheduling Fundamentals
The objective of multiprogramming is to have some process running at all times to maximize CPU utilization. In a uniprocessor system, only one process can run at a time; any other processes must wait until the CPU is free and can be rescheduled.
CPU scheduling decisions take place under four conditions:
1. When a process switches from the running state to the waiting state (for I/O request).
2. When a process switches from the running state to the ready state (e.g., when an interrupt occurs).
3. When a process switches from the waiting state to the ready state (e.g., completion of I/O).
4. When a process terminates.

Under conditions 1 and 4, there is no choice in terms of scheduling; a new process must be selected. When scheduling takes place only under these conditions, the scheduling scheme is nonpreemptive or cooperative. Otherwise, the scheduling scheme is preemptive.

2. Scheduling Criteria & Algorithms
Different CPU scheduling algorithms have distinct properties:
- CPU utilization: Keep the CPU as busy as possible (ranging from 40% to 90%).
- Throughput: Number of processes that complete their execution per time unit.
- Turnaround time: The interval from the time of submission of a process to the time of completion.
- Waiting time: The sum of the periods spent waiting in the ready queue.
- Response time: The time from the submission of a request until the first response is produced.

First-Come, First-Served (FCFS) Scheduling:
The process that requests the CPU first is allocated the CPU first. It is easily implemented with a FIFO queue. The major drawback is the convoy effect, where short processes wait behind a long CPU-bound process.

Shortest-Job-First (SJF) Scheduling:
Associates with each process the length of its next CPU burst. When the CPU is available, it is assigned to the process that has the smallest next CPU burst. SJF is optimal because it gives the minimum average waiting time for a given set of processes. The difficulty is knowing the length of the next CPU request.

Round-Robin (RR) Scheduling:
Designed especially for time-sharing systems. A small unit of time, called a time quantum or time slice, is defined (typically 10 to 100 milliseconds). The ready queue is treated as a circular queue. If a process burst exceeds the time quantum, it is preempted and put at the tail of the ready queue.

3. Process Synchronization & Deadlocks
Cooperating processes require mechanisms for orderly execution. A critical section is a piece of code that accesses shared resources.
Deadlock occurs when every process in a set is waiting for an event that only another process in the set can cause.
Four Coffman conditions must hold simultaneously for a deadlock to arise:
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. No Preemption: Resources cannot be preempted; a resource can be released only voluntarily by the process holding it.
4. Circular Wait: A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain.
`.trim();

  const doc = await prisma.document.create({
    data: {
      subjectId: csSubject.id,
      title: 'Operating Systems: CPU Scheduling & Deadlocks',
      fileName: 'os_lecture4_scheduling.pptx',
      fileType: 'pptx',
      fileSize: 142850,
      filePath: './uploads/sample_os_lecture4.pptx',
      rawText: sampleDocText,
      status: 'READY',
      summary: 'Examines CPU scheduling criteria (FCFS, SJF, Round-Robin), preemptive vs nonpreemptive models, critical sections, and the four Coffman conditions for deadlock.',
      pageCount: 18,
      wordCount: 520,
    },
  });

  // Topics
  const topic1 = await prisma.topic.create({
    data: {
      documentId: doc.id,
      title: 'CPU Scheduling & Criteria',
      summary: 'Principles of multiprogramming, throughput, turnaround time, waiting time, and preemptive mechanisms.',
      orderIndex: 0,
    },
  });

  const topic2 = await prisma.topic.create({
    data: {
      documentId: doc.id,
      title: 'Scheduling Algorithms (FCFS, SJF, RR)',
      summary: 'Algorithmic comparison including the convoy effect in FCFS, SJF optimality, and Round-Robin time quanta.',
      orderIndex: 1,
    },
  });

  const topic3 = await prisma.topic.create({
    data: {
      documentId: doc.id,
      title: 'Process Synchronization & Deadlocks',
      summary: 'Critical section problem and the four simultaneous Coffman conditions required for deadlocks.',
      orderIndex: 2,
    },
  });

  // Concepts
  await prisma.concept.createMany({
    data: [
      {
        documentId: doc.id,
        topicId: topic1.id,
        term: 'Preemptive Scheduling',
        definition: 'A scheduling strategy where the operating system can interrupt an executing process and move it to the ready queue when a higher priority process arrives or a time slice expires.',
        importance: 'High',
      },
      {
        documentId: doc.id,
        topicId: topic2.id,
        term: 'Convoy Effect',
        definition: 'A performance degradation observed in FCFS scheduling where multiple short CPU-bound or I/O-bound processes wait behind one long process.',
        importance: 'High',
      },
      {
        documentId: doc.id,
        topicId: topic2.id,
        term: 'Time Quantum',
        definition: 'A fixed duration of time (typically 10-100ms) allotted to each process in Round-Robin scheduling before context switching.',
        importance: 'Medium',
      },
      {
        documentId: doc.id,
        topicId: topic3.id,
        term: 'Coffman Conditions',
        definition: 'The four necessary and simultaneous criteria for a system deadlock: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.',
        importance: 'High',
      },
      {
        documentId: doc.id,
        topicId: topic1.id,
        term: 'Turnaround Time',
        definition: 'The total elapsed time from the moment a process is submitted until its complete execution terminates.',
        importance: 'Medium',
      },
    ],
  });

  // Notes
  await prisma.note.createMany({
    data: [
      {
        documentId: doc.id,
        topicId: topic1.id,
        title: 'CPU Scheduling Fundamentals & Metrics',
        markdownContent: `
# CPU Scheduling Fundamentals

## Multiprogramming Objective
The core goal of multiprogramming is to maximize CPU utilization by keeping at least one process running at all times.

### The Four Scheduling Circumstances
1. **Running to Waiting:** Initiated during an I/O request (Nonpreemptive).
2. **Running to Ready:** Triggered by timer interrupts or expiration of time quantum (Preemptive).
3. **Waiting to Ready:** Triggered upon completion of an I/O operation.
4. **Process Termination:** When a process exits (Nonpreemptive).

### Core Optimization Metrics
* **Throughput:** Maximizing the rate of process completion per unit time.
* **Turnaround Time:** Minimizing submission-to-completion duration.
* **Waiting Time:** Minimizing duration spent in the Ready queue.
* **Response Time:** Minimizing latency for interactive time-sharing systems.
`.trim(),
      },
      {
        documentId: doc.id,
        topicId: topic2.id,
        title: 'Algorithmic Comparison: FCFS vs SJF vs Round-Robin',
        markdownContent: `
# Scheduling Algorithms Analysis

## 1. First-Come, First-Served (FCFS)
* **Mechanics:** Processes are scheduled in arrival sequence using a standard FIFO queue.
* **Vulnerability:** Highly susceptible to the **Convoy Effect**, where short processes linger behind CPU-heavy tasks, degrading average waiting time.

## 2. Shortest-Job-First (SJF)
* **Optimality:** Mathematically proven to deliver the minimum average waiting time for any fixed process batch.
* **Limitation:** In practical systems, the exact length of the next CPU burst cannot be known deterministically and must be estimated exponentially.

## 3. Round-Robin (RR)
* **Target Environment:** Interactive time-sharing computing.
* **Time Slice:** Allocates a quantum $q$ (typically 10-100 ms).
* **Trade-off:** If $q$ is excessively large, RR degrades into FCFS; if $q$ is extremely small, overhead from context switching dominates.
`.trim(),
      },
      {
        documentId: doc.id,
        topicId: topic3.id,
        title: 'Deadlock Conditions & Prevention',
        markdownContent: `
# Concurrency & Deadlock Criteria

A deadlock occurs when every process in a set is blocked waiting for an event that only another blocked process in the set can release.

## The 4 Simultaneous Coffman Conditions
1. **Mutual Exclusion:** Resources cannot be shared simultaneously.
2. **Hold and Wait:** Processes currently holding allocated resources request new ones without releasing held ones.
3. **No Preemption:** Resources can only be released voluntarily by the holding process.
4. **Circular Wait:** Process $P_0$ waits for resource held by $P_1$, $P_1$ waits for $P_2$, ..., and $P_n$ waits for $P_0$.

> **Key Rule:** Breaking even ONE of these conditions guarantees deadlock prevention.
`.trim(),
      },
    ],
  });

  // Flashcards
  await prisma.flashcard.createMany({
    data: [
      {
        documentId: doc.id,
        topicId: topic1.id,
        front: 'What is the main objective of multiprogramming in an operating system?',
        back: 'To maximize CPU utilization by ensuring that a process is running on the CPU at all times.',
        difficulty: 'Easy',
      },
      {
        documentId: doc.id,
        topicId: topic2.id,
        front: 'Why is Shortest-Job-First (SJF) considered optimal?',
        back: 'SJF is optimal because it gives the minimum average waiting time for a given set of processes.',
        difficulty: 'Medium',
      },
      {
        documentId: doc.id,
        topicId: topic2.id,
        front: 'What is the Convoy Effect in First-Come, First-Served (FCFS) scheduling?',
        back: 'The phenomenon where multiple short processes must wait for a long CPU-bound process to finish, causing high average waiting times.',
        difficulty: 'Medium',
      },
      {
        documentId: doc.id,
        topicId: topic2.id,
        front: 'What happens to Round-Robin scheduling if the time quantum is set excessively large?',
        back: 'Round-Robin degrades into standard First-Come, First-Served (FCFS) scheduling.',
        difficulty: 'Hard',
      },
      {
        documentId: doc.id,
        topicId: topic3.id,
        front: 'Name the four simultaneous Coffman conditions required for a deadlock.',
        back: '1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait.',
        difficulty: 'Hard',
      },
      {
        documentId: doc.id,
        topicId: topic1.id,
        front: 'Define Turnaround Time in the context of CPU scheduling.',
        back: 'The total elapsed time from the submission of a process until its complete execution terminates.',
        difficulty: 'Easy',
      },
    ],
  });

  // 10 Practice MCQs
  const questionsData = [
    {
      documentId: doc.id,
      topicId: topic1.id,
      type: 'mcq',
      questionText: 'Under which of the following transitions is CPU scheduling strictly nonpreemptive?',
      options: JSON.stringify([
        'When a process switches from running to waiting state',
        'When a process switches from running to ready state',
        'When an interrupt occurs',
        'When a higher-priority process enters the ready queue',
      ]),
      correctAnswer: 'When a process switches from running to waiting state',
      explanation: 'Under transitions from running to waiting (I/O) or termination, the process voluntarily relinquishes the CPU, meaning the scheduling is nonpreemptive or cooperative.',
      difficulty: 'Medium',
    },
    {
      documentId: doc.id,
      topicId: topic2.id,
      type: 'mcq',
      questionText: 'Which scheduling algorithm is mathematically proven to provide the minimum average waiting time?',
      options: JSON.stringify([
        'Shortest-Job-First (SJF)',
        'First-Come, First-Served (FCFS)',
        'Round-Robin (RR)',
        'Multilevel Feedback Queue',
      ]),
      correctAnswer: 'Shortest-Job-First (SJF)',
      explanation: 'SJF scheduling is optimal because scheduling the shortest next burst first minimizes the cumulative delay experienced by all subsequent waiting processes.',
      difficulty: 'Easy',
    },
    {
      documentId: doc.id,
      topicId: topic2.id,
      type: 'mcq',
      questionText: 'What is the primary disadvantage of the First-Come, First-Served (FCFS) scheduling policy?',
      options: JSON.stringify([
        'The convoy effect degrades average waiting time',
        'It causes excessive context-switching overhead',
        'It cannot be implemented with a standard FIFO queue',
        'It requires precise future knowledge of CPU bursts',
      ]),
      correctAnswer: 'The convoy effect degrades average waiting time',
      explanation: 'In FCFS, when a process with a massive CPU burst occupies the processor, all shorter and I/O-bound processes are blocked behind it, resulting in the convoy effect.',
      difficulty: 'Easy',
    },
    {
      documentId: doc.id,
      topicId: topic2.id,
      type: 'mcq',
      questionText: 'In Round-Robin scheduling, what is the consequence of choosing an excessively small time quantum?',
      options: JSON.stringify([
        'Context-switching overhead consumes too much CPU time',
        'The scheduler degenerates into standard FCFS',
        'Short processes suffer from starvation',
        'Turnaround time is permanently reduced to zero',
      ]),
      correctAnswer: 'Context-switching overhead consumes too much CPU time',
      explanation: 'If the time quantum is too small, the CPU spends a significant fraction of its cycles executing context switches between process control blocks rather than running user code.',
      difficulty: 'Hard',
    },
    {
      documentId: doc.id,
      topicId: topic3.id,
      type: 'mcq',
      questionText: 'How many Coffman conditions must hold simultaneously for a deadlock to exist in a system?',
      options: JSON.stringify(['All 4 conditions', 'Any 1 condition', 'At least 2 conditions', 'Exactly 3 conditions']),
      correctAnswer: 'All 4 conditions',
      explanation: 'Deadlock arises if and only if all four Coffman conditions (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait) hold simultaneously.',
      difficulty: 'Easy',
    },
    {
      documentId: doc.id,
      topicId: topic3.id,
      type: 'mcq',
      questionText: 'Which Coffman condition is eliminated if resources can be forcibly reclaimed from a waiting process?',
      options: JSON.stringify(['No Preemption', 'Mutual Exclusion', 'Hold and Wait', 'Circular Wait']),
      correctAnswer: 'No Preemption',
      explanation: 'By allowing the OS to preempt resources held by a process that is requesting additional unavailable resources, the "No Preemption" condition is broken.',
      difficulty: 'Medium',
    },
    {
      documentId: doc.id,
      topicId: topic1.id,
      type: 'mcq',
      questionText: 'Which metric measures the sum of all periods a process spends waiting in the ready queue?',
      options: JSON.stringify(['Waiting time', 'Turnaround time', 'Response time', 'Throughput']),
      correctAnswer: 'Waiting time',
      explanation: 'Waiting time is specifically the total amount of time a process spends waiting in the ready queue before and between its CPU bursts.',
      difficulty: 'Easy',
    },
    {
      documentId: doc.id,
      topicId: topic2.id,
      type: 'mcq',
      questionText: 'Round-Robin scheduling is designed primarily for which type of operating systems?',
      options: JSON.stringify(['Time-sharing interactive systems', 'Hard real-time avionics systems', 'Batch mainframe systems', 'Static ROM microcontrollers']),
      correctAnswer: 'Time-sharing interactive systems',
      explanation: 'Round-Robin was designed for time-sharing systems where each interactive user expects prompt responsiveness without any process monopolizing the CPU.',
      difficulty: 'Medium',
    },
    {
      documentId: doc.id,
      topicId: topic1.id,
      type: 'mcq',
      questionText: 'What constitutes the time from when a request is submitted until the very first output is produced?',
      options: JSON.stringify(['Response time', 'Turnaround time', 'Throughput', 'Execution burst']),
      correctAnswer: 'Response time',
      explanation: 'Response time measures the elapsed interval from request submission to the initial visible response, which is crucial in interactive systems.',
      difficulty: 'Medium',
    },
    {
      documentId: doc.id,
      topicId: topic3.id,
      type: 'mcq',
      questionText: 'Which condition implies that a closed chain of processes exists where each process holds resources needed by the next?',
      options: JSON.stringify(['Circular Wait', 'Mutual Exclusion', 'Hold and Wait', 'Starvation']),
      correctAnswer: 'Circular Wait',
      explanation: 'Circular Wait requires that {P0, P1, ..., Pn} exists such that P0 waits for a resource held by P1, P1 waits for P2, and Pn waits for P0.',
      difficulty: 'Easy',
    },
  ];

  for (const q of questionsData) {
    await prisma.question.create({ data: q });
  }

  // Pre-seed a completed quiz session so analytics has instant historical data
  const quizSession = await prisma.quizSession.create({
    data: {
      subjectId: csSubject.id,
      documentId: doc.id,
      title: 'Practice Quiz: Operating Systems',
      totalQuestions: 10,
      correctAnswers: 8,
      scorePercentage: 80,
      timeSpentSeconds: 145,
      completedAt: new Date(Date.now() - 3600 * 1000 * 2), // 2 hours ago
    },
  });

  // Pre-seed activity log
  await prisma.activityLog.create({
    data: {
      subjectId: csSubject.id,
      type: 'UPLOAD',
      description: 'Processed "Operating Systems: CPU Scheduling & Deadlocks" with 3 notes and 10 MCQs.',
    },
  });

  await prisma.activityLog.create({
    data: {
      subjectId: csSubject.id,
      type: 'QUIZ_COMPLETED',
      description: 'Completed Practice Quiz: Operating Systems with 80% accuracy (8/10).',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
