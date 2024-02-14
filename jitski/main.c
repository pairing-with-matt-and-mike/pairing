#include <assert.h>
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <unistd.h>

// https://en.wikibooks.org/wiki/X86_Assembly/X86_Architecture
// http://www.c-jump.com/CIS77/CPU/x86/lecture.html#X77_0020_encoding_overview
// http://ref.x86asm.net/coder64-abc.html

typedef enum x86_opcode {
  X86_OPCODE_ADD,
  X86_OPCODE_MOV,
  X86_OPCODE_MOV_IMM32,
  X86_OPCODE_RET,
  X86_OPCODE_LABEL,
  X86_OPCODE_CALL
} x86_opcode_t;

typedef enum x86_reg {
  X86_REG_RDI = 0b111,
  X86_REG_RSI = 0b110,
  X86_REG_RBP = 0b101,
  X86_REG_RSP = 0b100,
  X86_REG_RBX = 0b011,
  X86_REG_RDX = 0b010,
  X86_REG_RCX = 0b001,
  X86_REG_RAX = 0b000
} x86_reg_t;

typedef struct x86_inst {
  x86_opcode_t opcode;
} x86_inst_t;

typedef struct x86_add {
  x86_opcode_t opcode;
  x86_reg_t dest;
  x86_reg_t src;
} x86_add_t;

typedef struct x86_mov {
  x86_opcode_t opcode;
  x86_reg_t dest;
  x86_reg_t src;
} x86_mov_t;

typedef struct x86_mov_imm32 {
  x86_opcode_t opcode;
  x86_reg_t dest;
  uint32_t src;
} x86_mov_imm32_t;

typedef struct x86_ret {
  x86_opcode_t opcode;
} x86_ret_t;

typedef struct x86_label {
  x86_opcode_t opcode;
  char* label;
} x86_label_t;

typedef struct x86_call {
  x86_opcode_t opcode;
  size_t label;
} x86_call_t;

x86_inst_t* x86_add(x86_reg_t dest, x86_reg_t src) {
  x86_add_t* add = malloc(sizeof(x86_add_t));
  add->opcode = X86_OPCODE_ADD;
  add->dest = dest;
  add->src = src;
  return (x86_inst_t*) add;
}

x86_inst_t* x86_mov(x86_reg_t dest, x86_reg_t src) {
  x86_mov_t* mov = malloc(sizeof(x86_mov_t));
  mov->opcode = X86_OPCODE_MOV;
  mov->dest = dest;
  mov->src = src;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_mov_imm32(x86_reg_t dest, uint32_t src) {
  x86_mov_imm32_t* mov = malloc(sizeof(x86_mov_imm32_t));
  mov->opcode = X86_OPCODE_MOV_IMM32;
  mov->dest = dest;
  mov->src = src;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_ret() {
  x86_ret_t* ret = malloc(sizeof(x86_ret_t));
  ret->opcode = X86_OPCODE_RET;
  return (x86_inst_t*) ret;
}

x86_inst_t* x86_label(char* label) {
  x86_label_t* inst = malloc(sizeof(x86_label_t));
  inst->opcode = X86_OPCODE_LABEL;
  inst->label = label;
  return (x86_inst_t*) inst;
}

x86_inst_t* x86_call(size_t label) {
  x86_call_t* inst = malloc(sizeof(x86_call_t));
  inst->opcode = X86_OPCODE_CALL;
  inst->label = label;
  return (x86_inst_t*) inst;
}

void* functions[100];

size_t assemble_inst(x86_inst_t* inst, char* output) {
  switch (inst->opcode) {
  case X86_OPCODE_ADD:
    x86_add_t* add = (x86_add_t*) inst;
    output[0] = 0x01;
    output[1] = (0b11 << 6) | (add->src << 3) | add->dest;
    return 2;
  case X86_OPCODE_CALL:
    x86_call_t* call = (x86_call_t*) inst;
    output[0] = 0xe8;
    ssize_t offset = ((ssize_t)functions[call->label]) - (((ssize_t)output) + 5);
    assert(offset >= INT32_MIN && offset <= INT32_MAX);
    *((int32_t*)&output[1]) = offset;
    return 5;
  case X86_OPCODE_LABEL:
    return 0;
  case X86_OPCODE_MOV:
    x86_mov_t* mov = (x86_mov_t*) inst;
    output[0] = 0x89;
    output[1] = (0b11 << 6) | (mov->src << 3) | mov->dest;
    return 2;
  case X86_OPCODE_MOV_IMM32:
    x86_mov_imm32_t* mov_imm32 = (x86_mov_imm32_t*) inst;
    output[0] = 0xc7;
    output[1] = (0b11 << 6) | (mov_imm32->dest);
    *((uint32_t*)&output[2]) = mov_imm32->src;
    return 6;
  case X86_OPCODE_RET:
    output[0] = 0xc3;
    return 1;
  default:
    return 0;
  }
}

void* assemble(x86_inst_t** instructions) {
  int pagesize = getpagesize();
  char* m = mmap(NULL,
                 pagesize,
                 PROT_READ | PROT_WRITE | PROT_EXEC,
                 MAP_SHARED | MAP_ANONYMOUS,
                 -1,
                 0);

  size_t output_index = 0;
  for (size_t i = 0; instructions[i] != NULL; i++) {
    output_index += assemble_inst(instructions[i], &m[output_index]);
  }

  return m;
}

int FUNCTION_G = 0;
int FUNCTION_F = 1;

int main () {

  x86_inst_t* jit_call_instructions[] = {
    // jit_call()
    x86_call(FUNCTION_F),
    x86_ret(),
    NULL,
  };

  x86_inst_t* f_instructions[] = {
    // f(a) { return g() + a; }
    x86_label("f"),
    x86_call(FUNCTION_G),
    x86_add(X86_REG_RAX, X86_REG_RDI),
    x86_ret(),
    NULL,
  };

  x86_inst_t* g_instructions[] = {
    // g() { return 10; }
    x86_label("g"),
    x86_mov_imm32(X86_REG_RAX, 10),
    x86_ret(),
    NULL,
  };

  void* g = assemble(g_instructions);
  functions[FUNCTION_G] = g;
  void* f = assemble(f_instructions);
  functions[FUNCTION_F] = f;
  void* jit_call = assemble(jit_call_instructions);

  int (*add10)(int) = (int (*)(int)) jit_call;

  int result = add10(3);
  printf("%d\n", result);

  return 0;
}
