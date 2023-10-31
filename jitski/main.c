#include <stdio.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <unistd.h>

int add(int a, int b) {
  return a + b;
}

int main () {
  int pagesize = getpagesize();

  char* m = mmap(NULL,
                 pagesize,
                 PROT_READ | PROT_WRITE | PROT_EXEC,
                 MAP_SHARED | MAP_ANONYMOUS,
                 -1,
                 0);

  m[0] = 0x8d;
  m[1] = 0x04;
  m[2] = 0x37;
  m[3] = 0xc3;

  int (*add2)(int, int) = (int (*)(int, int))m;

  int result = add2(4, 3);
  printf("%d\n", result);

  return 0;
}



//    1149:	f3 0f 1e fa          	endbr64
//    114d:	55                   	push   rbp
//    114e:	48 89 e5             	mov    rbp,rsp
//    1151:	89 7d fc             	mov    DWORD PTR [rbp-0x4],edi
//    1154:	89 75 f8             	mov    DWORD PTR [rbp-0x8],esi
//    1157:	8b 55 fc             	mov    edx,DWORD PTR [rbp-0x4]
//    115a:	8b 45 f8             	mov    eax,DWORD PTR [rbp-0x8]
//    115d:	01 d0                	add    eax,edx
//    115f:	5d                   	pop    rbp
//    1160:	c3                   	ret

//    1149:	f3 0f 1e fa          	endbr64
//    114d:	8d 04 37             	lea    eax,[rdi+rsi*1]
//    1150:	c3                   	ret
