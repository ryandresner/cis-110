# One Computer

## Overview

* **Files** - Exploring how data is organized, stored, and accessed within computer systems
* **Programs** - Examining how software instructions are created, compiled, and executed by the computer
* **Hardware** - Understanding the physical components that make up a computer and how they work together to process information
* **Operating System** - Learning how software manages hardware resources and provides a platform for applications

## Pre-Test

Please click through the following categories and read the exam questions.  I'd recommend making a note of the ones you think will be easy and which ones you think will be hard. 

{{ConceptMap:concept-map.yml}}

## Video Content

We'll begin with an overview of the four topics in this chapter: hardware, programs, operating systems, and files. 

{{YouTube:https://www.youtube.com/watch?v=4xlfqyBNQxE}}

### Hardware and Programs

The relationship between hardware and software is one of the most subtle and interesting things in computing.  Understanding the anatomy of a simple CPU and how it interacts with a program stored in main memory (RAM) is the subject of the next two videos and numerous questions on the final exam. 

#### Part 1 (Hardware)

Here we'll discuss several pieces of hardware, setting the stage for the two components that enable the computer to run programs: the CPU and RAM.

{{YouTube:https://www.youtube.com/watch?v=a8jlUVv4o4g}}

#### Part 2 (Programs)

Here we zoom in on the interactions between the CPU and RAM by illustrating how a simple assembly language program might execute on a hypothetical CPU.

{{YouTube:https://www.youtube.com/watch?v=294U8gdMJfk}}

### Operating System

Now that we've seen how programs are executed, we can begin to understand the program that manages all the other programs: the operating system.

{{YouTube:https://www.youtube.com/watch?v=Z38xp5Eb3S0}}

### Files

We finish up this chapter by discussing one of the main abstractions that the operating system provides: files.

{{YouTube:https://www.youtube.com/watch?v=UQliHa58SB4}}

## Main Content

The following three sections cover each of the three topics and provide multiple acceptable ways to answer each final exam question.  At the end of this page, you'll find the Bonus Videos section with links to various videos that cover these same topics (often in much greater depth than is required for this course).

### Hardware

Computer hardware forms the physical foundation that transforms electricity into computation. Understanding these components helps us appreciate how abstract concepts like programs and data become tangible operations.

**The IPO Model (Input-Process-Output):**
- **Input**: Devices that bring data into the system (keyboard, mouse, sensors, network interfaces)
- **Process**: The CPU and memory that manipulate and transform data according to program instructions
- **Output**: Devices that present results to users or other systems (display, speakers, printers, network)

**Core Hardware Components:**
- **Processor (CPU)**: The "brain" that executes instructions and performs calculations
- **Memory (RAM vs ROM)**: Temporary workspace (RAM) for active programs vs permanent storage (ROM) for essential startup instructions
- **Storage**: Long-term data retention using various technologies (hard drives, SSDs, optical media)
- **Graphics Processing Unit (GPU)**: Specialized processor optimized for parallel operations and visual rendering

**Data Flow Through the System:**
Data moves through a computer in a carefully orchestrated dance: input devices capture information, the CPU processes it according to program instructions stored in memory, and output devices present the results. This cycle happens billions of times per second, creating the illusion of instantaneous computation.

**Storage Technology Trade-offs:**
Different storage technologies offer different balances of speed, capacity, cost, and durability. Understanding these trade-offs helps explain why computers use multiple storage types - from ultra-fast CPU cache to massive but slower hard drives.

{{ExamQuestions:concept-map.yml concept_filter:"Hardware"}}

### Operating System

The operating system serves as the crucial bridge between hardware and software, managing resources and providing a consistent interface for programs to interact with the computer's capabilities.

**Core Operating System Functions:**
- **Resource Management**: Allocating CPU time, memory, and storage among competing programs
- **Device Drivers**: Software that translates between the OS and specific hardware components
- **Process Management**: Starting, stopping, and scheduling programs for execution
- **Security**: Controlling access to files, network resources, and system functions

**Multitasking vs Multiprocessing:**
- **Multitasking**: One CPU rapidly switches between multiple programs, creating the illusion of simultaneous execution
- **Multiprocessing**: Multiple CPUs or CPU cores actually execute different programs simultaneously
- **Modern systems** typically combine both approaches for maximum efficiency

**Hardware-Software Integration:**
The operating system abstracts hardware complexity, allowing programs to request services (like "save this file" or "display this image") without needing to know the specific details of hard drives or graphics cards. This abstraction enables software portability and simplifies programming.

**Examples of Operating Systems:**
- **Desktop**: Windows, macOS, Linux distributions
- **Mobile**: iOS, Android
- **Embedded**: Real-time operating systems in cars, appliances, industrial equipment
- **Server**: Specialized versions optimized for network services and high availability

The operating system is often invisible to users, but it's constantly working behind the scenes to coordinate all the complex interactions that make modern computing possible.

{{ExamQuestions:concept-map.yml concept_filter:"Operating System"}}

### Files 

Files represent the fundamental way computers organize and store information. Understanding file systems helps us navigate, organize, and manage the vast amounts of data that modern computers handle.

**File Naming Conventions:**
- **Extensions**: .txt, .jpg, .exe indicate file type and help the OS choose appropriate programs
- **Restrictions**: Different systems have rules about allowed characters, length limits, and case sensitivity
- **Best Practices**: Descriptive names, consistent patterns, avoiding special characters for compatibility

**Absolute vs Relative Paths:**
- **Absolute Paths**: Complete addresses from the root directory (e.g., /Users/john/Documents/report.pdf)
- **Relative Paths**: Addresses relative to current location (e.g., ../images/photo.jpg)
- **Importance**: Understanding paths is crucial for programming, command line usage, and troubleshooting

**Logical vs Physical Storage:**
- **Logical View**: Files and folders organized in a hierarchical tree structure that users see
- **Physical Reality**: Data scattered across disk sectors, managed by the file system
- **File System Tasks**: Tracking which sectors belong to which files, managing free space, ensuring data integrity

**Efficient File Organization:**
- **Hierarchical Structure**: Folders within folders to categorize related files
- **Naming Schemes**: Consistent patterns that make files easy to find and sort
- **Backup Strategies**: Protecting important data through redundancy and version control
- **Cleanup Practices**: Regular maintenance to remove unnecessary files and organize growing collections
- **Metadata**: Optional data embedded within a file which provides additional, useful information to the user and the OS

The file system creates the illusion of neatly organized folders and documents, while actually managing the complex task of storing and retrieving data on physical storage devices.

{{ExamQuestions:concept-map.yml concept_filter:"Files"}}

### Programs

Programs represent the instructions that transform computers from expensive calculators into versatile problem-solving machines. Understanding how programs work reveals the magic behind all software applications.

**The Stored Program Concept:**
Modern computers store both data and program instructions in the same memory system. This revolutionary idea, introduced by John von Neumann, allows computers to modify their own behavior by loading different programs - the foundation of software versatility.

**Programming Process Overview:**
1. **Problem Definition**: Identifying what needs to be solved and designing an algorithm
2. **Code Writing**: Expressing the algorithm in a programming language humans can read
3. **Compilation/Interpretation**: Translating human-readable code into machine instructions
4. **Execution**: The CPU following the machine instructions to solve the problem
5. **Testing and Debugging**: Verifying the program works correctly and fixing errors

**Compilation vs Interpretation:**
- **Compilers**: Translate entire programs into machine code before execution (faster runtime, platform-specific)
- **Interpreters**: Translate and execute code line-by-line (slower runtime, more portable and flexible)
- **Modern Hybrid Approaches**: Just-in-time compilation, bytecode interpretation

**Levels of Programming Languages:**
- **Machine Code**: Binary instructions the CPU executes directly (1s and 0s)
- **Assembly Language**: Human-readable mnemonics for machine instructions (ADD, MOVE, JUMP)
- **High-Level Languages**: Abstract programming languages that hide hardware details (Python, Java, C++)

**Program Execution Analysis:**
When you run a program, the operating system loads it into memory, the CPU fetches instructions one by one, executes them (possibly involving calculations, memory access, or input/output), and continues until the program completes or encounters an error.

Understanding programming helps us appreciate the incredible complexity hidden behind simple actions like clicking a button or opening a file.

{{ExamQuestions:concept-map.yml concept_filter:"Programs"}}

## Bonus Videos

These videos provide deeper insights into the fundamental components and concepts of individual computer systems.

### Files

{{YouTube:https://www.youtube.com/watch?v=KN8YgJnShPM}}

{{YouTube:https://www.youtube.com/watch?v=mzUyMy7Ihk0}}

{{YouTube:https://www.youtube.com/watch?v=V2Gxqv3bJCk}}

{{YouTube:https://www.youtube.com/watch?v=DYGIPiez5GY}}

{{YouTube:https://www.youtube.com/watch?v=qJeZJL-ypyI}}

{{YouTube:https://www.youtube.com/watch?v=Uro0GDMR2A8}}

### Programs

{{YouTube:https://www.youtube.com/watch?v=Z5JC9Ve1sfI}}

{{YouTube:https://www.youtube.com/watch?v=jFDMZpkUWCw}}

{{YouTube:https://www.youtube.com/watch?v=ByllwN8q2ss}}

{{YouTube:https://www.youtube.com/watch?v=04UGopESS6A}}

{{YouTube:https://www.youtube.com/watch?v=v97HAhwQMj8}}

{{YouTube:https://www.youtube.com/watch?v=8Qx6Dr_aKXs}}

### Operating Systems

{{YouTube:https://www.youtube.com/watch?v=fkGCLIQx1MI}}

{{YouTube:https://www.youtube.com/watch?v=26QPDBe-NB8}}

{{YouTube:https://www.youtube.com/watch?v=pVzRTmdd9j0}}

{{YouTube:https://www.youtube.com/watch?v=vLwMl9qK4T8}}

{{YouTube:https://www.youtube.com/watch?v=9GDX-IyZ_C8}}

### Hardware 

{{YouTube:https://www.youtube.com/watch?v=GYlNoAMBY6o}}

{{YouTube:https://www.youtube.com/watch?v=Ui6QyzcD3_E}}

{{YouTube:https://www.youtube.com/watch?v=H4SDPLiUnv4}}

{{YouTube:https://www.youtube.com/watch?v=DBRNE3A5Wvw}}

{{YouTube:https://www.youtube.com/watch?v=sp3mMwo3PO0}}

{{YouTube:https://www.youtube.com/watch?v=bY6NQb10AaI}}

{{YouTube:https://www.youtube.com/watch?v=SbqXqQ-2ixs}}

{{YouTube:https://www.youtube.com/watch?v=1dZ55MjjZY0}}

{{YouTube:https://www.youtube.com/watch?v=TQCr9RV7twk}}

{{YouTube:https://www.youtube.com/watch?v=p3q5zWCw8J4}}

{{YouTube:https://www.youtube.com/watch?v=AkFi90lZmXA}}

{{YouTube:https://www.youtube.com/watch?v=CBf-jIn44X0}}

{{YouTube:https://www.youtube.com/watch?v=HjneAhCy2N4}}

{{YouTube:https://www.youtube.com/watch?v=fpnE6UAfbtU}}

{{YouTube:https://www.youtube.com/watch?v=_0KIfGxp37E}}

{{YouTube:https://www.youtube.com/watch?v=E7Up7VuFd8A}}

{{YouTube:https://www.youtube.com/watch?v=h9Z4oGN89MU}}

{{YouTube:https://www.youtube.com/watch?v=Axd50ew4pco}}

{{YouTube:https://www.youtube.com/watch?v=_Pqfjer8-O4}}
