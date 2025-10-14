// Code templates for different programming languages

function generateStarterCode(language, questionText) {
    switch (language.toLowerCase()) {
        case 'javascript':
            return generateJavaScriptStarterCode(questionText);
        case 'python':
            return generatePythonStarterCode(questionText);
        case 'java':
            return generateJavaStarterCode(questionText);
        case 'cpp':
        case 'c++':
            return generateCppStarterCode(questionText);
        case 'csharp':
        case 'c#':
            return generateCSharpStarterCode(questionText);
        case 'go':
            return generateGoStarterCode(questionText);
        case 'rust':
            return generateRustStarterCode(questionText);
        case 'php':
            return generatePHPStarterCode(questionText);
        case 'ruby':
            return generateRubyStarterCode(questionText);
        case 'typescript':
            return generateTypeScriptStarterCode(questionText);
        default:
            return generateJavaScriptStarterCode(questionText);
    }
}

function generateJavaScriptStarterCode(questionText) {
    if (questionText.includes('array')) {
        return `function solve(arr) {
    // Your code here
    return arr;
}

// Example usage:
// console.log(solve([1, 2, 3]));`;
    } else if (questionText.includes('string')) {
        return `function solve(str) {
    // Your code here
    return str;
}

// Example usage:
// console.log(solve("hello"));`;
    } else {
        return `function solve() {
    // Your code here
    return null;
}

// Example usage:
// console.log(solve());`;
    }
}

function generatePythonStarterCode(questionText) {
    if (questionText.includes('array')) {
        return `def solve(arr):
    # Your code here
    return arr

# Example usage:
# print(solve([1, 2, 3]))`;
    } else if (questionText.includes('string')) {
        return `def solve(s):
    # Your code here
    return s

# Example usage:
# print(solve("hello"))`;
    } else {
        return `def solve():
    # Your code here
    return None

# Example usage:
# print(solve())`;
    }
}

function generateCppStarterCode(questionText) {
    if (questionText.includes('array')) {
        return `#include <iostream>
#include <vector>
using namespace std;

vector<int> solve(vector<int>& arr) {
    // Your code here
    return arr;
}

int main() {
    vector<int> arr = {1, 2, 3};
    vector<int> result = solve(arr);
    for (int x : result) {
        cout << x << " ";
    }
    return 0;
}`;
    } else if (questionText.includes('string')) {
        return `#include <iostream>
#include <string>
using namespace std;

string solve(string s) {
    // Your code here
    return s;
}

int main() {
    string s = "hello";
    string result = solve(s);
    cout << result << endl;
    return 0;
}`;
    } else {
        return `#include <iostream>
using namespace std;

void solve() {
    // Your code here
}

int main() {
    solve();
    return 0;
}`;
    }
}

function generateJavaStarterCode(questionText) {
    if (questionText.includes('array')) {
        return `public class Solution {
    public int[] solve(int[] arr) {
        // Your code here
        return arr;
    }
    
    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] arr = {1, 2, 3};
        int[] result = sol.solve(arr);
        for (int x : result) {
            System.out.print(x + " ");
        }
    }
}`;
    } else if (questionText.includes('string')) {
        return `public class Solution {
    public String solve(String s) {
        // Your code here
        return s;
    }
    
    public static void main(String[] args) {
        Solution sol = new Solution();
        String s = "hello";
        String result = sol.solve(s);
        System.out.println(result);
    }
}`;
    } else {
        return `public class Solution {
    public void solve() {
        // Your code here
    }
    
    public static void main(String[] args) {
        Solution sol = new Solution();
        sol.solve();
    }
}`;
    }
}

function generateCSharpStarterCode(questionText) {
    if (questionText.includes('array')) {
        return `using System;

public class Solution {
    public int[] Solve(int[] arr) {
        // Your code here
        return arr;
    }
    
    public static void Main(string[] args) {
        Solution sol = new Solution();
        int[] arr = {1, 2, 3};
        int[] result = sol.Solve(arr);
        foreach (int x in result) {
            Console.Write(x + " ");
        }
    }
}`;
    } else if (questionText.includes('string')) {
        return `using System;

public class Solution {
    public string Solve(string s) {
        // Your code here
        return s;
    }
    
    public static void Main(string[] args) {
        Solution sol = new Solution();
        string s = "hello";
        string result = sol.Solve(s);
        Console.WriteLine(result);
    }
}`;
    } else {
        return `using System;

public class Solution {
    public void Solve() {
        // Your code here
    }
    
    public static void Main(string[] args) {
        Solution sol = new Solution();
        sol.Solve();
    }
}`;
    }
}

function generateGoStarterCode(questionText) {
    if (questionText.includes('array')) {
        return `package main

import "fmt"

func solve(arr []int) []int {
    // Your code here
    return arr
}

func main() {
    arr := []int{1, 2, 3}
    result := solve(arr)
    fmt.Println(result)
}`;
    } else if (questionText.includes('string')) {
        return `package main

import "fmt"

func solve(s string) string {
    // Your code here
    return s
}

func main() {
    s := "hello"
    result := solve(s)
    fmt.Println(result)
}`;
    } else {
        return `package main

import "fmt"

func solve() {
    // Your code here
}

func main() {
    solve()
}`;
    }
}

function generateRustStarterCode(questionText) {
    if (questionText.includes('array')) {
        return `fn solve(arr: Vec<i32>) -> Vec<i32> {
    // Your code here
    arr
}

fn main() {
    let arr = vec![1, 2, 3];
    let result = solve(arr);
    println!("{:?}", result);
}`;
    } else if (questionText.includes('string')) {
        return `fn solve(s: String) -> String {
    // Your code here
    s
}

fn main() {
    let s = String::from("hello");
    let result = solve(s);
    println!("{}", result);
}`;
    } else {
        return `fn solve() {
    // Your code here
}

fn main() {
    solve();
}`;
    }
}

function generatePHPStarterCode(questionText) {
    if (questionText.includes('array')) {
        return `<?php
function solve($arr) {
    // Your code here
    return $arr;
}

// Example usage:
$arr = [1, 2, 3];
$result = solve($arr);
print_r($result);
?>`;
    } else if (questionText.includes('string')) {
        return `<?php
function solve($s) {
    // Your code here
    return $s;
}

// Example usage:
$s = "hello";
$result = solve($s);
echo $result;
?>`;
    } else {
        return `<?php
function solve() {
    // Your code here
}

// Example usage:
solve();
?>`;
    }
}

function generateRubyStarterCode(questionText) {
    if (questionText.includes('array')) {
        return `def solve(arr)
    # Your code here
    arr
end

# Example usage:
# puts solve([1, 2, 3])`;
    } else if (questionText.includes('string')) {
        return `def solve(s)
    # Your code here
    s
end

# Example usage:
# puts solve("hello")`;
    } else {
        return `def solve
    # Your code here
end

# Example usage:
# solve`;
    }
}

function generateTypeScriptStarterCode(questionText) {
    if (questionText.includes('array')) {
        return `function solve(arr: number[]): number[] {
    // Your code here
    return arr;
}

// Example usage:
// console.log(solve([1, 2, 3]));`;
    } else if (questionText.includes('string')) {
        return `function solve(str: string): string {
    // Your code here
    return str;
}

// Example usage:
// console.log(solve("hello"));`;
    } else {
        return `function solve(): void {
    // Your code here
}

// Example usage:
// solve();`;
    }
}

module.exports = {
    generateStarterCode,
    generateJavaScriptStarterCode,
    generatePythonStarterCode,
    generateCppStarterCode,
    generateJavaStarterCode,
    generateCSharpStarterCode,
    generateGoStarterCode,
    generateRustStarterCode,
    generatePHPStarterCode,
    generateRubyStarterCode,
    generateTypeScriptStarterCode
};